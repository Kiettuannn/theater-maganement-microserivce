# Notification Service — Specification

> **Source**: Direct code read on 2026-06-21.
> **Port**: 8085 (HTTP) + `9092` (Socket.IO — separate dedicated port)
> **Database**: PostgreSQL (per-service schema)
> **Message Broker**: Kafka (all input is event-driven — no sync outbound calls)
> **External**: Brevo Transactional Email API (`https://api.brevo.com/v3/smtp/email`)

---

## 1. Service Overview

The Notification Service is **event-driven and passive** — it receives Spring application events (in the monolith) or Kafka events (in the microservice) and dispatches notifications over two channels:

| Channel | Delivery Mechanism | Description |
|---------|-------------------|-------------|
| **EMAIL** | Brevo Transactional Email API via OpenFeign | Server-rendered Thymeleaf HTML email |
| **IN_APP** | Saved to DB + pushed via Socket.IO | Frontend polls or receives real-time push |

**The service has zero synchronous outbound calls to other business services.** All data needed for notifications is either embedded in the event payload or (in the monolith) re-queried from shared DB tables.

**In the monolith**: Notifications are triggered by **Spring `ApplicationEvent`s** fired with `@TransactionalEventListener(phase = AFTER_COMMIT)` — guaranteed to run after the source transaction commits.

**In the microservice**: These Spring events must be replaced by **Kafka consumer handlers** that subscribe to the relevant topics.

---

## 2. Domain Model

### 2.1 Entity Graph

```
NotificationTemplate ──── Notification [N] ──── NotificationLog [N per channel]
                          (per recipient)
NotificationChannel  ──── NotificationPreference [N per user+channel+category]
```

---

### 2.2 Entity Definitions

#### NotificationTemplate

**Table**: `notification_templates`
**Soft-delete**: yes

| Field | Java Type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `String` | `id` | PK (from BaseEntity) |
| `templateCode` | `String` | `template_code` | Unique lookup key (e.g. `"booking.confirmed"`) |
| `titleTemplate` | `String` | `title_template` | Title with `{{variable}}` placeholders |
| `contentTemplate` | `String` | `content_template` | TEXT; HTML with `{{variable}}` placeholders |
| `deleted` | `Boolean` | inherited | Soft-delete |

**Template variable syntax**: `{{variableName}}` — simple `String.replace()` substitution (NOT Thymeleaf or FreeMarker).

> ⚠️ Note: `NotificationTemplate` is for **in-app/generic** channel only. Email templates use a **completely separate Thymeleaf-based system** (see §5).

---

#### Notification

**Table**: `notifications`
**Soft-delete**: yes
**Extends**: `BaseEntity` (has `id`, `createdAt`, `updatedAt`, `deleted`)

| Field | Java Type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `String` | `id` | PK |
| `notificationTemplate` | `NotificationTemplate` | `template_id` | FK; nullable (can omit template and use ad-hoc metadata) |
| `recipientId` | `String` | `recipient_id` | `accountId` from Identity Service |
| `recipientType` | `RecipientType` | `recipient_type` | `CUSTOMER`, `STAFF`, `ADMIN` |
| `metadata` | `Map<String,Object>` | `metadata` | JSONB; holds `{title, content, category, bookingId, ...}` |
| `priority` | `Priority` | `priority` | `LOW`, `NORMAL`, `HIGH`, `URGENT` |
| `status` | `NotificationStatus` | `status` | `PENDING` / `SENT` / `READ` / `FAILED` |
| `readAt` | `LocalDateTime` | `read_at` | Null = unread; set by `markAsRead()` |

**`isRead`**: derived: `notification.readAt != null`

---

#### NotificationLog

**Table**: `notification_logs`
**Soft-delete**: yes

| Field | Java Type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `String` | `id` | PK |
| `notification` | `Notification` | `notification_id` | FK |
| `channelName` | `String` | `channel_name` | `"EMAIL"` or `"IN_APP"` |
| `status` | `String` | `status` | `"SENT"`, `"FAILED"`, `"SKIPPED"` |
| `providerResponse` | `Map<String,Object>` | `provider_response` | JSONB; e.g. `{messageId: "brevo-id"}` or `{reason: "..."}` |
| `sentAt` | `LocalDateTime` | `sent_at` | When the send was attempted |

One log record is created per channel per notification attempt.

---

#### NotificationChannel

**Table**: `notification_channels`
**Soft-delete**: yes

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `name` | `String` | `"EMAIL"` or `"IN_APP"` |
| `isActive` | `Boolean` | Whether this channel is globally available |
| `configJson` | `Map<String,Object>` | JSONB; channel-specific config (e.g. API endpoint, rate limits) |

---

#### NotificationPreference

**Table**: `notification_preferences`
**Soft-delete**: yes

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `recipientId` | `String` | `accountId` |
| `recipientType` | `RecipientType` | |
| `channel` | `NotificationChannel` | FK |
| `category` | `NotificationCategory` | `BOOKING` or `SYSTEM` |
| `isEnabled` | `Boolean` | User's opt-in/out setting for this channel+category |

**Used by**: `NotificationDispatcher` checks `preferenceService.isChannelEnabledForUser(recipientId, channelName, category)` before sending. If disabled → status logged as `"SKIPPED"`.

---

## 3. Notification Dispatch Architecture

### 3.1 Component Flow

```
Event Source (Kafka/Spring event)
        │
        ▼
NotificationEventListener (Spring @TransactionalEventListener)
        │  → Monolith: fires @Async after AFTER_COMMIT phase
        │  → Microservice: @KafkaListener
        │
        ├──[EMAIL path]─────────────────────────────────────────────┐
        │  EmailTemplateFactory.buildTemplate(EmailType, variables) │
        │  (Thymeleaf TemplateEngine renders HTML from .html file)  │
        │  EmailBuilderService → EmailService → EmailClient (Feign) │
        │  POST https://api.brevo.com/v3/smtp/email                 │
        │  with api-key header                                      │
        └───────────────────────────────────────────────────────────┘
        
        ├──[IN_APP path via NotificationService.createAndSend()]────┐
        │  1. Load NotificationTemplate by templateCode             │
        │  2. Render title/content via {{placeholder}} substitution │
        │  3. Save Notification entity (status=PENDING)             │
        │  4. NotificationDispatcher.dispatch() [async]:            │
        │     a. Check NotificationPreference                       │
        │     b. Find channel provider (InAppChannelProvider)       │
        │     c. InAppChannelProvider.send() → marks SENT in log    │
        │     d. NotificationLog saved                              │
        │     e. Notification.status = SENT                         │
        │  5. SocketIOService.emitNotificationToUser(userId, dto)   │
        │     → Socket.IO room "user:{accountId}"                   │
        │     → event name: "notification:new"                      │
        └───────────────────────────────────────────────────────────┘
```

### 3.2 Dual-path Design

**Email** notifications and **IN_APP** notifications follow entirely different code paths:

| Aspect | EMAIL | IN_APP |
|--------|-------|--------|
| Triggered by | `NotificationEventListener` directly | `NotificationService.createAndSend()` |
| Template system | Thymeleaf (`.html` files in classpath) | `{{placeholder}}` simple substitution on DB template |
| Delivery | Brevo API via Feign | DB save + Socket.IO push |
| Persistence | No `Notification` entity; uses `EmailClient` directly | `Notification` entity + `NotificationLog` |
| Channel provider | `EmailChannelProvider` (when dispatched via `NotificationService`) | `InAppChannelProvider` |

> **Important**: In the monolith, most email notifications are sent **directly** by `NotificationEventListener` (bypassing `NotificationService` and the `Notification` entity entirely). Only notifications sent via `NotificationService.createAndSend()` (the admin API) use the `NotificationTemplate` + `NotificationDispatcher` pipeline.

---

## 4. Event → Notification Mapping

> **Monolith implementation**: All event listeners are Spring `@TransactionalEventListener` fired `AFTER_COMMIT`, `@Async`. They **directly call** `EmailTemplateFactory + EmailBuilderService` for email — no Kafka involved. The mappings below document what happens and what must be converted to Kafka consumers in the microservice.

---

### `TicketCreatedEvent` (→ microservice: `TicketIssued` Kafka event)

| Property | Value |
|----------|-------|
| **Trigger** | After `confirmBookingPayment()` → `createTickets()` |
| **Channel(s)** | EMAIL only (no IN_APP) |
| **Email type** | `TICKET_ISSUE` → `email/ticket-issue.html` |
| **Recipient** | `account.email` (from `event.accountId`) |
| **Subject** | `"Your Movie Ticket – Cifastar HCM"` |

**Email variables**:
| Variable | Value | Source |
|----------|-------|--------|
| `username` | `account.username` | Identity |
| `bookingCode` | `booking.id.toString()` | Booking entity |
| `movieName` | `booking.screening.movie.title` | Catalog (cross-domain join in mono) |
| `showTime` | `booking.screening.startTime` | Screening |
| `cinema` | `booking.screening.room.cinema.name` | Cinema |
| `tickets` | `List<TicketEmailView>` | Each: `{seatCode, seatType, ticketCode, ticketPrice}` |
| `totalPrice` | `booking.totalAmount` | Booking |
| `email` | `account.email` | Identity |

**Attachments**: One QR code PNG per ticket, generated server-side by `QrImageGenerator.generateBase64Qr(ticket.qrContent)`. File named `"QR-{ticketCode}.png"`. Attached as `SendSmtpEmailAttachment` via Brevo API.

> **QR note**: The monolith **does** generate QR images server-side (despite `service-boundaries.md` saying "QR code removed"). `QrImageGenerator` converts the JSON `qrContent` string to a Base64-encoded PNG. In the microservice, decide if QR image attachments should be retained or the frontend handles QR rendering.

**In-app content** (NOT sent in current code — email only):
- Title: `"Your tickets for {movieName}"`
- Body: `"Booking {bookingCode} confirmed. {N} ticket(s) attached."`

---

### `InvoiceRefundedEvent` (→ microservice: `InvoiceRefunded` Kafka event)

| Property | Value |
|----------|-------|
| **Trigger** | `PATCH /invoices/{id}/status?status=REFUNDED` |
| **Channel(s)** | EMAIL only |
| **Email type** | `REFUND_NOTIFICATION` → `email/refund-notification.html` |
| **Recipient** | `booking.customer.account.email` |
| **Guard** | If `booking.customer == null` OR email blank → **skip silently** |
| **Subject** | `"Your Refund Has Been Processed – Cifastar HCM"` |

**Email variables**:
| Variable | Value |
|----------|-------|
| `username` | `account.username` |
| `bookingCode` | `booking.id.toString()` |
| `movieName` | `booking.screening.movie.title` |
| `showTime` | `booking.screening.startTime` |
| `cinema` | `booking.screening.room.cinema.name` |
| `refundAmount` | `booking.totalAmount` (full amount — no partial refunds) |
| `email` | `account.email` |

**Attachments**: None.

---

### `CustomerCreatedEvent` (→ microservice: `CustomerRegistered` Kafka event)

| Property | Value |
|----------|-------|
| **Trigger** | New customer auto-created during `createBooking()` (guest with email) |
| **Channel(s)** | EMAIL only |
| **Email type** | `WELCOME_CUSTOMER` → `email/welcome-customer.html` |
| **Recipient** | `customer.account.email` |
| **Subject** | `"Welcome {firstName} to Cifastar HCM!"` |

**Email variables**:
| Variable | Value |
|----------|-------|
| `name` | `customer.lastName + " " + customer.firstName` |
| `username` | `customer.account.email` (not the display username — actual email used as login) |
| `password` | `event.rawPassword` (cleartext temporary password — **transmitted in email**) |
| `loginUrl` | `"http://localhost:3000"` (⚠️ hardcoded localhost — must be env var in microservice) |

---

### `PasswordResetEvent`

| Property | Value |
|----------|-------|
| **Trigger** | User requests password reset OTP |
| **Channel(s)** | EMAIL only |
| **Email type** | `RESET_PASSWORD` → `email/reset-password.html` |
| **Subject** | `"Prove Your Cifastar HCM Identity"` |

**Email variables**:
| Variable | Value |
|----------|-------|
| `username` | `account.username` |
| `otpCode` | The generated OTP code |
| `otpDuration` | From `otp.valid-duration` property (minutes) |
| `email` | `account.email` |

---

### `StaffCreatedEvent`

| Property | Value |
|----------|-------|
| **Trigger** | Admin creates a staff account |
| **Channel(s)** | EMAIL only |
| **Email type** | `WELCOME_STAFF` → `email/welcome-staff.html` |
| **Subject** | `"Welcome {firstName} to Our Team!"` |

**Email variables**:
| Variable | Value |
|----------|-------|
| `name` | `staff.firstName` |
| `username` | `staff.account.username` |
| `password` | `event.rawPassword` (cleartext) |
| `loginUrl` | `"http://localhost:5173/admin/login"` (⚠️ hardcoded) |

---

### Events NOT yet handled (microservice targets)

> The following events are defined in `service-boundaries.md` or inferred from the Booking Service spec but have **no handler in the monolith**. They need to be implemented in the microservice.

| Kafka Event | Description | Suggested Action |
|-------------|-------------|-----------------|
| `BookingCreated` | Booking is pending, payment not yet made | EMAIL: "Your booking is awaiting payment" + IN_APP |
| `PaymentConfirmed` | Already handled via `TicketCreatedEvent` in mono | EMAIL: "Payment received, processing tickets" (pre-ticket) |
| `PaymentFailed` | VNPay declined | EMAIL + IN_APP: "Your payment failed. Please retry." |
| `BookingCancelled` | User cancelled booking | EMAIL + IN_APP: "Booking cancelled, seat locks released" |

---

## 5. Brevo Integration

### 5.1 API Used

**Brevo Transactional Email API** — `POST /v3/smtp/email`

```java
@FeignClient(name = "email-client", url = "https://api.brevo.com")
interface EmailClient {
    @PostMapping(value = "/v3/smtp/email", ...)
    EmailResponse sendEmail(@RequestHeader("api-key") String apiKey, @RequestBody EmailRequest body);
}
```

- **Not** using Brevo Template API (template IDs in Brevo dashboard) — all HTML is rendered **server-side** by Thymeleaf and passed as `htmlContent` in the request body.
- **Not** using Brevo SDK directly — uses the raw REST API via Spring Cloud OpenFeign.

### 5.2 Request Structure (`EmailRequest`)

```json
{
  "sender": {
    "name":  "Cifastar",
    "email": "theonlytruth25012005@gmail.com"
  },
  "to": [
    { "email": "customer@example.com", "name": "John Doe" }
  ],
  "subject": "Your Movie Ticket – Cifastar HCM",
  "htmlContent": "<html>...</html>",
  "attachment": [
    { "name": "QR-TK-3FA85F64.png", "content": "<base64-bytes>" }
  ]
}
```

### 5.3 API Key Config

```yaml
# application.yml
brevo:
  apiKey: ${BREVO_API_KEY}  # [SECRET] — from environment variable
```

```java
@Value("${brevo.apiKey}")
protected String apiKey;
// Passed as: emailClient.sendEmail(apiKey, emailRequest)
// HTTP header: "api-key: <value>"
```

### 5.4 Sender Identity

**Hardcoded** in `EmailService`:
- `sender.name` = `"Cifastar"`
- `sender.email` = `"theonlytruth25012005@gmail.com"` (developer email — must be changed in production)

### 5.5 Error Handling

`EmailService.sendEmail()` catches `FeignException` and re-throws as `AppException(ErrorCode.USER_EXISTED)` — this error code is incorrect (it's reused from account creation) and should be replaced with a proper `EMAIL_SEND_FAILED` error code in the microservice.

---

## 6. Template Engine

### 6.1 Two Independent Template Systems

The service uses **two different template systems** simultaneously:

---

#### System A: Thymeleaf (for email HTML body)

- **Engine**: Spring `TemplateEngine` (Thymeleaf)
- **Template location**: `src/main/resources/templates/email/*.html`
- **Template selection**: `EmailTemplateFactory.buildTemplate(EmailType, variables)` maps `EmailType` enum → file path
- **Variable injection**: Standard Thymeleaf `${variable}` expressions + `th:text`, `th:each`
- **Global variables** auto-injected by `EmailTemplateFactory`:

| Variable | Value |
|----------|-------|
| `appName` | `"Cifastar HCM"` |
| `companyName` | `"Cifastar"` |
| `companyUrl` | `"https://cifastar.com"` |
| `companyAddress` | `"123 Cifastar St, HCM City, Vietnam"` |
| `year` | Current year (`Year.now().getValue()`) |

**Template files** (all in `src/main/resources/templates/email/`):

| File | EmailType | Event |
|------|-----------|-------|
| `reset-password.html` | `RESET_PASSWORD` | `PasswordResetEvent` |
| `welcome-staff.html` | `WELCOME_STAFF` | `StaffCreatedEvent` |
| `welcome-customer.html` | `WELCOME_CUSTOMER` | `CustomerCreatedEvent` |
| `ticket-issue.html` | `TICKET_ISSUE` | `TicketCreatedEvent` |
| `refund-notification.html` | `REFUND_NOTIFICATION` | `InvoiceRefundedEvent` |
| `notification-email.html` | `NOTIFICATION_EMAIL` | Manual admin send |

> **Note**: There is **no** `booking-confirmation` or `payment-confirmed` email template in the current codebase. These email types are not yet implemented.

---

#### System B: `{{placeholder}}` Substitution (for IN_APP / generic notifications)

Used by `NotificationTemplateService.renderTemplate()`:

```java
for (Map.Entry<String, Object> entry : variables.entrySet()) {
    String placeholder = "{{" + entry.getKey() + "}}";
    content = content.replace(placeholder, String.valueOf(entry.getValue()));
}
```

- Templates stored in the `notification_templates` DB table
- Variables are raw `Map<String, Object>` → `String.valueOf(value)`
- Content sanitized via **Jsoup** before storage (prevents XSS in admin-created templates)
- Size limit: 100KB

---

#### System A — Example: `ticket-issue.html`

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<body>
<div class="container">
    <strong th:text="'Dear ' + ${username} + ','">Dear User,</strong>
    
    <div class="ticket-code" th:text="'Booking Code: ' + ${bookingCode}">
        Booking Code: ABC123
    </div>
    
    <strong>Movie:</strong> <span th:text="${movieName}">Movie Name</span><br/>
    <strong>Showtime:</strong> <span th:text="${showTime}">2025-01-01 19:00</span><br/>
    <strong>Cinema:</strong> <span th:text="${cinema}">Cifastar HCM</span>
    
    <table>
        <thead><tr><th>Seat</th><th>Ticket Code</th></tr></thead>
        <tbody>
        <tr th:each="ticket : ${tickets}">
            <td><strong>
                <span th:text="${ticket.seatCode}">F12</span>
                (<span th:text="${ticket.seatType}">VIP</span>)
            </strong></td>
            <td><span th:text="${ticket.ticketCode}">TK-XXXXXXXX</span></td>
        </tr>
        </tbody>
    </table>
    
    <!-- QR attachment notice -->
    <div>📎 QR Check-in: Each ticket has a QR code attached to this email.</div>
    
    <p>
        <strong>Total Amount:</strong>
        <span th:text="${#numbers.formatDecimal(totalPrice, 0, 'COMMA', 0, 'POINT')}">160,000</span> VND
    </p>
</div>
</body>
</html>
```

---

## 7. Socket.IO (Real-time IN_APP)

**Library**: `com.corundumstudio.socketio` (`netty-socketio`)

**Port**: `9092` (from `application.yml socketio.port`)

**Rooms**: Each connected user joins room `"user:{accountId}"`.

**Event name**: `"notification:new"`

**Payload**: Serialized `NotificationDetailResponse` JSON string (via Jackson `ObjectMapper`).

**Delivery flow**:
```java
socketServer.getRoomOperations("user:" + userId)
    .sendEvent("notification:new", notificationJson);
```

**Online-only**: If the user has no active Socket.IO connection (`clients.isEmpty()`), the notification is **silently dropped** from the Socket.IO push. However, the `Notification` entity is still saved to DB and can be polled via `GET /notifications`.

---

## 8. API Endpoints

### 8.1 User-facing (`/notifications`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/notifications` | Auth | Paginated list of own notifications (`?page=0&size=20`) |
| `GET` | `/notifications/unread-count` | Auth | Count of unread (no `readAt`) notifications |
| `GET` | `/notifications/{id}` | Auth | Notification detail with delivery logs |
| `PUT` | `/notifications/{id}/read` | Auth | Mark one notification as read |
| `PUT` | `/notifications/read-all` | Auth | Mark all notifications as read |
| `DELETE` | `/notifications/{id}` | Auth | Soft-delete a notification |

### 8.2 Admin (`/admin/notifications`)

All require `ROLE_ADMIN`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/notifications` | All notifications paginated (default size=50) |
| `POST` | `/admin/notifications/send` | Manually trigger notification to specified recipients |
| `GET` | `/admin/notifications/logs` | All delivery logs |
| `GET` | `/admin/notifications/logs/{id}` | Delivery log detail |
| `DELETE` | `/admin/notifications/logs/{id}` | Soft-delete log |
| `GET` | `/admin/notifications/{id}` | Notification detail |
| `DELETE` | `/admin/notifications/{id}` | Soft-delete notification |
| `GET` | `/admin/notifications/in-app` | Own in-app notifications (any authenticated) |
| `PATCH` | `/admin/notifications/{id}/read` | Mark as read (any authenticated) |
| `PATCH` | `/admin/notifications/read-all` | Mark all as read (any authenticated) |

#### `CreateNotificationRequest` (admin send)

```json
{
  "recipientIds": ["accountId-1", "accountId-2"],
  "recipientType": "CUSTOMER",
  "templateCode": "booking.confirmed",
  "channels": ["EMAIL", "IN_APP"],
  "category": "BOOKING",
  "priority": "NORMAL",
  "metadata": {
    "bookingCode": "BK-3FA85F64",
    "movieName": "Avengers"
  }
}
```

### 8.3 Template Management (`/notification-templates`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/notification-templates` | Admin | Create template (Jsoup-sanitized) |
| `GET` | `/notification-templates` | Admin | List all templates |
| `GET` | `/notification-templates/{id}` | Admin | Get template |
| `PUT` | `/notification-templates/{id}` | Admin | Update template |
| `DELETE` | `/notification-templates/{id}` | Admin | Soft-delete |

### 8.4 Preference Management (`/notification-preferences`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notification-preferences/{recipientId}` | Get all preferences for a user |
| `PUT` | `/notification-preferences/{recipientId}/{channelId}` | Enable/disable a channel for a category |

---

## 9. Data Ownership

| Table | Notes |
|-------|-------|
| `notifications` | One per recipient per event; soft-delete |
| `notification_logs` | One per channel per notification attempt |
| `notification_templates` | DB-managed in-app/generic templates; soft-delete |
| `notification_channels` | `EMAIL`, `IN_APP` records; config as JSONB |
| `notification_preferences` | Per-user per-channel per-category opt-in/out |

---

## 10. Enums Reference

| Enum | Values | Notes |
|------|--------|-------|
| `NotificationStatus` | `PENDING`, `SENT`, `READ`, `FAILED` | Status of the `Notification` entity |
| `NotificationCategory` | `BOOKING`, `SYSTEM` | Used in preferences; `BOOKING` for all booking-related events |
| `Priority` | `LOW`, `NORMAL`, `HIGH`, `URGENT` | Stored on `Notification` entity |
| `RecipientType` | `CUSTOMER`, `STAFF`, `ADMIN` | Who receives the notification |
| `EmailType` | `RESET_PASSWORD`, `WELCOME_STAFF`, `NOTIFICATION_EMAIL`, `TICKET_ISSUE`, `WELCOME_CUSTOMER`, `REFUND_NOTIFICATION` | Maps to Thymeleaf template file |

---

## 11. Key Implementation Notes for Migration

1. **Spring events → Kafka consumers**: All `@TransactionalEventListener` handlers in `NotificationEventListener` must become `@KafkaListener` methods. The same logic applies — load referenced entities from the event payload (no cross-DB joins).

2. **Cross-domain DB joins must be eliminated**: In the monolith, `handleTicketCreatedEvent()` queries `bookingRepository.findById()`, then accesses `booking.getScreening().getMovie().getTitle()` (cross-domain Hibernate joins). In the microservice, all this data must be in the event payload.

3. **`TicketIssued` event payload must be self-contained**: Include `movieTitle`, `cinemaName`, `startTime`, `roomName`, `totalAmount`, list of `{ticketCode, seatName, seatType, price}` — so the Notification Service never needs to call Booking or Catalog Service.

4. **QR image generation decision needed**: `QrImageGenerator` generates PNG attachments for ticket emails. Decide if this stays server-side (keep `QrImageGenerator` in Notification Service with the `qrContent` JSON string as event payload) or moves to the frontend.

5. **Hardcoded URLs must be env vars**: `loginUrl = "http://localhost:3000"` (customer) and `loginUrl = "http://localhost:5173/admin/login"` (staff) in welcome emails must use configuration variables.

6. **Sender email must be changed**: `"theonlytruth25012005@gmail.com"` is hardcoded in `EmailService`. Must be configurable (`${brevo.sender.email}`).

7. **Socket.IO in microservice**: The Socket.IO server runs on port `9092` within the same JVM in the monolith. In the microservice, it stays in the Notification Service. Client connects to `ws://notification-service:9092` and joins room `"user:{accountId}"` to receive real-time IN_APP notifications.

8. **Error code reuse bug**: `EmailService` throws `AppException(ErrorCode.USER_EXISTED)` on Feign error. This must be fixed to a proper `EMAIL_SEND_FAILED` error code.

9. **No `BookingCreated` / `PaymentFailed` email templates exist**: These are entirely new work. Templates need to be created for the microservice.

10. **`NotificationLog.status` is a raw `String`** (not enum): Values used in code are `"SENT"`, `"FAILED"`, `"SKIPPED"`. Consider converting to an enum for type safety.

---

## Appendix: Class Reference

| Class | Package | Role |
|-------|---------|------|
| `NotificationEventListener` | `notification.listener` | All Spring `@TransactionalEventListener` event handlers → email senders |
| `EmailTemplateFactory` | `notification.service` | Maps `EmailType` → Thymeleaf template file; renders HTML |
| `EmailBuilderService` | `notification.service` | Assembles `SendEmailRequest` + calls `EmailService` |
| `EmailService` | `notification.service` | Calls Brevo API via `EmailClient` Feign; injects `api-key` header |
| `EmailClient` | `notification.repository.httpClient` | `@FeignClient(url="https://api.brevo.com")` — `POST /v3/smtp/email` |
| `NotificationService` | `notification.service` | Create+send notifications via template pipeline; user read/unread management |
| `NotificationDispatcher` | `notification.service` | `@Async` orchestrator: preference check → provider selection → send → log |
| `EmailChannelProvider` | `notification.provider` | `NotificationChannelProvider` impl for EMAIL channel |
| `InAppChannelProvider` | `notification.provider` | `NotificationChannelProvider` impl for IN_APP (DB save + Socket.IO) |
| `NotificationTemplateService` | `notification.service` | CRUD for DB templates; `{{placeholder}}` rendering |
| `SocketIOService` | `notification.service` | Emits `"notification:new"` events to Socket.IO room `"user:{userId}"` |
| `NotificationPreferenceService` | `notification.service` | Check/update per-user channel preferences |
| `NotificationController` | `notification.controller` | User-facing: `/notifications/**` |
| `AdminNotificationController` | `notification.controller` | Admin: `/admin/notifications/**` |

---

*Updated: 2026-06-21 | Source: direct code read of all entities, services, providers, listeners, controllers, templates in `notification/` package and `src/main/resources/templates/email/`*
