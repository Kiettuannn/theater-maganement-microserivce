# Kafka Event Schema

> **Source**: Extracted from full code read on 2026-06-20.
> **Status**: Kafka is **NOT YET IMPLEMENTED** in the current monolith. The monolith uses **Spring Application Events** (in-process, synchronous/async) instead. This document:
> 1. Documents the existing Spring Application Events as they are in the mono codebase.
> 2. Designs the Kafka equivalents needed for the microservice architecture defined in `service-boundaries.md`.

---

## Current State: Spring Application Events (Monolith)

The monolith uses `ApplicationEventPublisher.publishEvent()` + `@TransactionalEventListener(phase = AFTER_COMMIT)`.

**Key properties of the current implementation:**
- **In-process only** — events never leave the JVM.
- **No Kafka, no message broker of any kind** in `application.yml` or any dependency.
- `@Async` on listener methods → events are dispatched on a separate thread after the originating transaction commits.
- **No retry, no DLQ, no idempotency** — if the listener throws, the event is lost.
- **No envelope** — events are plain Java objects passed by reference.

### Existing Event Map (Monolith)

| Event Class | Published By | Listened By | Trigger |
|------------|--------------|-------------|---------|
| `PasswordResetEvent` | `AuthenticationService.resetPassword()` | `NotificationEventListener.handlePasswordResetEvent()` | OTP password reset requested |
| `CustomerCreatedEvent` | `RegistrationService.StaffCreateCustomerAccount()`, `BookingServiceImpl.resolveCustomer()` | `NotificationEventListener.handleCustomerCreatedEvent()` | New customer account created (by staff or auto-created during guest booking) |
| `StaffCreatedEvent` | `RegistrationService.registerStaffAccount()` | `NotificationEventListener.handleStaffCreatedEvent()` | New staff account created by admin |
| `TicketCreatedEvent` | `TicketServiceImpl.createTickets()` | `NotificationEventListener.handleTicketCreatedEvent()` | Tickets generated after payment confirmed |
| `InvoiceRefundedEvent` | `InvoiceServiceImpl.updateInvoiceStatus()` | `NotificationEventListener.handleInvoiceRefundedEvent()` | Invoice marked `REFUNDED` |

### Existing Event Payloads (Monolith)

#### `PasswordResetEvent`
```java
Account account;   // full JPA entity (email, username)
String otpCode;    // 6-char OTP
```

#### `CustomerCreatedEvent`
```java
String customerId;   // UUID as String
String rawPassword;  // plain-text password to email
```

#### `StaffCreatedEvent`
```java
Staff staff;          // full JPA entity
String rawPassword;   // plain-text password to email
```

#### `TicketCreatedEvent`
```java
UUID bookingId;
UUID accountId;        // account (not customer) ID — used to look up email
List<UUID> ticketIds;  // IDs of all generated tickets for this booking
```

#### `InvoiceRefundedEvent`
```java
String invoiceId;
String bookingId;
```

---

## Target Architecture: Kafka Events for Microservices

The sections below design the Kafka event schema for the 6-service microservice architecture defined in `service-boundaries.md`.

---

## 1. Topic Naming Convention

**Proposed convention** (based on the service-boundaries.md architecture, no topic names exist in code yet):

```
cinema.{domain}.{event-name-past-tense}
```

| Segment | Description |
|---------|-------------|
| `cinema` | Global namespace prefix for this system |
| `{domain}` | Owning service domain: `catalog`, `booking`, `payment`, `notification`, `identity` |
| `{event-name-past-tense}` | Snake-case past-tense event name |

**Examples:**
```
cinema.catalog.screening-created
cinema.catalog.screening-cancelled
cinema.booking.booking-created
cinema.booking.booking-cancelled
cinema.booking.ticket-issued
cinema.booking.loyalty-points-earned
cinema.payment.payment-confirmed
cinema.payment.payment-failed
```

---

## 2. Event Envelope

**Proposed standard envelope** (to be implemented — does not exist in the monolith):

```json
{
  "eventId":     "uuid — unique ID for this event instance (for idempotency)",
  "eventType":   "string — e.g. ScreeningCreated",
  "occurredAt":  "ISO-8601 UTC timestamp — when the event was generated",
  "version":     "string — schema version, e.g. v1",
  "source":      "string — name of the publishing service, e.g. catalog-service",
  "payload":     {}
}
```

**Example:**
```json
{
  "eventId":    "7f3e4a91-0c12-4b56-8d22-aef1234bcde0",
  "eventType":  "BookingCreated",
  "occurredAt": "2026-06-20T15:30:00Z",
  "version":    "v1",
  "source":     "booking-service",
  "payload": {
    "bookingId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "...": "..."
  }
}
```

> The `eventId` is the primary idempotency key — consumers should record processed `eventId`s and skip duplicates.

---

## 3. Event Catalog

---

### `ScreeningCreated` ⚠️ [TO BE IMPLEMENTED]

- **Topic**: `cinema.catalog.screening-created`
- **Publisher**: Catalog Service
- **Consumers**: Booking Service
- **Trigger**: Admin successfully creates a new screening. Catalog Service computes the price snapshot per seat before publishing.
- **Payload** *(designed from `service-boundaries.md` + existing `ScreeningSeat` / `PriceConfig` code)*:

```json
{
  "screeningId":   "uuid — the new screening's ID",
  "roomId":        "uuid — which room this screening is in",
  "movieId":       "uuid — which movie is being screened",
  "cinemaId":      "uuid — which cinema branch",
  "startTime":     "ISO-8601 UTC — screening start",
  "endTime":       "ISO-8601 UTC — screening end",
  "dayType":       "string — WEEKDAY | WEEKEND (computed from startTime.date)",
  "timeSlot":      "string — MORNING | AFTERNOON | EVENING | LATE_NIGHT (computed from startTime.time)",
  "seats": [
    {
      "seatId":        "uuid — physical seat ID",
      "seatName":      "string — denormalized, e.g. A5",
      "seatTypeId":    "uuid — seat type",
      "seatTypeName":  "string — e.g. VIP, Standard",
      "price": "number — computed price in VND (PriceConfig.price or SeatType.basePriceModifier as fallback)"
    }
  ]
}
```

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Booking Service | Create one `seat_reservation` record per seat with `status=AVAILABLE`, `price=seats[].price`, `screeningId`, `seatId`, `seatName` |

> **Pricing fallback logic** (from `BookingServiceImpl.calculateSeatSubtotal()`): If no `PriceConfig` matches `(seatTypeId, dayType, timeSlot)`, use `SeatType.basePriceModifier` as the price.

---

### `ScreeningCancelled` ⚠️ [TO BE IMPLEMENTED]

- **Topic**: `cinema.catalog.screening-cancelled`
- **Publisher**: Catalog Service
- **Consumers**: Booking Service
- **Trigger**: Admin cancels or deletes a screening that is in `SCHEDULED` status.
- **Payload**:

```json
{
  "screeningId": "uuid — the cancelled screening's ID",
  "movieId":     "uuid",
  "cinemaId":    "uuid",
  "startTime":   "ISO-8601 UTC",
  "reason":      "string | null — optional cancellation reason"
}
```

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Booking Service | Mark all `seat_reservation` records for this `screeningId` as cancelled / delete them; release any Redis seat locks for this screening (`seat:lock:{screeningId}:*`) |

---

### `BookingCreated` ⚠️ [TO BE IMPLEMENTED]

> Monolith equivalent: **No direct equivalent** — the monolith calls `InvoiceService.createInvoice()` synchronously from the booking controller. In the monolith flow, `CustomerCreatedEvent` is fired inside `BookingServiceImpl` when a guest customer is auto-created, but there is no "BookingCreated" event.

- **Topic**: `cinema.booking.booking-created`
- **Publisher**: Booking Service
- **Consumers**: Payment Service, Notification Service
- **Trigger**: `POST /bookings` completes successfully — booking is persisted with `status=PENDING`.
- **Payload**:

```json
{
  "bookingId":    "uuid",
  "customerId":   "uuid | null — null for guest bookings",
  "customerEmail":"string | null",
  "screeningId":  "uuid",
  "movieTitle":   "string — denormalized for notifications",
  "cinemaName":   "string — denormalized",
  "startTime":    "ISO-8601 UTC",
  "subtotal":     "number — VND, before discounts",
  "discount":     "number — VND loyalty discount applied",
  "totalAmount":  "number — VND, final amount to pay",
  "expiredAt":    "ISO-8601 UTC — booking hold expiry (createdAt + 10 min)",
  "seatNames":    ["array of string — e.g. [A1, A2]"],
  "combos": [
    {
      "comboId":   "uuid",
      "comboName": "string",
      "quantity":  "number"
    }
  ]
}
```

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Payment Service | Store `bookingId` + `totalAmount` in local cache/DB to be ready when `POST /invoices` is called; optionally pre-create a PENDING invoice |
| Notification Service | Send "booking confirmation — pending payment" in-app notification to customer |

---

### `BookingCancelled` ⚠️ [TO BE IMPLEMENTED]

> Monolith equivalent: `BookingServiceImpl.cancelBooking()` calls `screeningSeatRepository.releaseSeatsByBooking()` directly. No event emitted.

- **Topic**: `cinema.booking.booking-cancelled`
- **Publisher**: Booking Service
- **Consumers**: Payment Service, Notification Service
- **Trigger**: `POST /bookings/{id}/cancel` completes, or booking hold TTL expires (scheduled cleanup).
- **Payload**:

```json
{
  "bookingId":    "uuid",
  "customerId":   "uuid | null",
  "customerEmail":"string | null",
  "totalAmount":  "number — original paid amount (0 if never paid)",
  "cancelledAt":  "ISO-8601 UTC",
  "reason":       "string — CUSTOMER_REQUEST | TIMEOUT | ADMIN_CANCEL"
}
```

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Payment Service | If invoice exists and was `PAID`, initiate refund flow; if `PENDING`, mark invoice as `FAILED` |
| Notification Service | Send cancellation email / in-app notification |

---

### `PaymentConfirmed` ⚠️ [TO BE IMPLEMENTED]

> Monolith equivalent: `PaymentServiceImpl.handleVNPayIPN()` / `handleVNPayCallback()` / `processCashPayment()` call `bookingService.confirmBookingPayment()` and `revenueAggregationService.*` **synchronously** in the same transaction. There is no async event.

- **Topic**: `cinema.payment.payment-confirmed`
- **Publisher**: Payment Service
- **Consumers**: Booking Service, Analytics Service, Notification Service
- **Trigger**: VNPay IPN callback received with `ResponseCode=00` (success), OR cash payment processed by cashier.
- **Payload**:

```json
{
  "invoiceId":        "uuid",
  "bookingId":        "uuid",
  "paymentId":        "uuid — the Payment record ID (idempotency key for Analytics)",
  "customerId":       "uuid | null",
  "customerEmail":    "string | null — stored by Payment Service from BookingCreated event",
  "paymentMethod":    "string — VNPAY | CASH",
  "transactionCode":  "string — VNPay txnRef or internal cash ref",
  "amountPaid":       "number — VND, total paid",
  "paidAt":           "ISO-8601 UTC"
}
```

> ⚠️ **Design decision**: `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold`
> are **NOT** in `PaymentConfirmed` because Payment Service does not own this data.
> Analytics Service must consume the `BookingPaid` event (see below) to get these fields.
> Analytics correlates `PaymentConfirmed` and `BookingPaid` by `bookingId`.

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Booking Service | Set `booking.status = PAID`; set all `seat_reservation.status = BOOKED`; create tickets; publish `TicketIssued`, `BookingPaid`, `LoyaltyPointsEarned` |
| Analytics Service | Record payment fact (`paymentId`, `amountPaid`, `paidAt`) as idempotency anchor in `revenue_processing_log`; wait for `BookingPaid` for revenue breakdown |
| Notification Service | Send "payment confirmed" in-app notification using `customerEmail` from this event |

---

### `PaymentFailed` ⚠️ [TO BE IMPLEMENTED]

> Monolith equivalent: No async event — payment failure is handled by returning an error response; the invoice stays `FAILED`.

- **Topic**: `cinema.payment.payment-failed`
- **Publisher**: Payment Service
- **Consumers**: Booking Service, Notification Service
- **Trigger**: VNPay IPN or callback returns failure code; or payment timeout.
- **Payload**:

```json
{
  "invoiceId":     "uuid",
  "bookingId":     "uuid",
  "paymentId":     "uuid",
  "customerId":    "uuid | null",
  "customerEmail": "string | null — stored by Payment Service from BookingCreated event",
  "failureCode":   "string — VNPay ResponseCode or internal code",
  "failureReason": "string — human-readable failure reason",
  "failedAt":      "ISO-8601 UTC"
}
```

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Booking Service | Release all `seat_reservation` records for this `bookingId` back to `AVAILABLE`; set `booking.status = EXPIRED` |
| Notification Service | Send payment failure alert to customer using `customerEmail` from this event |

---

### `BookingPaid` ⚠️ [TO BE IMPLEMENTED]

> **NEW event** — not present in the monolith. Required to give Analytics Service the revenue breakdown that Payment Service cannot provide.

- **Topic**: `cinema.booking.booking-paid`
- **Publisher**: Booking Service
- **Consumers**: Analytics Service
- **Trigger**: Booking Service receives `PaymentConfirmed` → sets `booking.status = PAID` → then publishes `BookingPaid` with the full revenue breakdown.
- **Purpose**: Provides `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold` that Payment Service does not own. Analytics correlates this event with `PaymentConfirmed` by `bookingId`.
- **Payload**:

```json
{
  "eventId":   "uuid",
  "eventType": "BookingPaid",
  "occurredAt": "ISO-8601 UTC",
  "source":    "booking-service",
  "payload": {
    "bookingId":        "uuid",
    "paymentId":        "uuid — echoed from PaymentConfirmed; correlation key with Analytics",
    "paidAt":           "ISO-8601 UTC",
    "customerId":       "uuid | null",
    "movieId":          "uuid",
    "movieTitle":       "string — denormalized from Booking entity",
    "cinemaId":         "uuid",
    "cinemaName":       "string — denormalized from Booking entity",
    "screeningId":      "uuid",
    "ticketRevenue":    "number — sum of seat prices from seat_reservations for this booking",
    "comboRevenue":     "number — sum of (unitPrice × quantity) from booking_combos",
    "totalAmount":      "number — ticketRevenue + comboRevenue − discount",
    "discount":         "number — loyalty points discount applied (VND)",
    "totalTicketsSold": "int — count of seat_reservation records in BOOKED status for this booking",
    "screeningDate":    "date (yyyy-MM-dd) — date portion of screening startTime, for daily revenue grouping"
  }
}
```

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Analytics Service | Upsert `daily_revenue_summary` (key: `cinemaId` + `screeningDate`); upsert `movie_revenue` (key: `movieId` + `cinemaId` + `screeningDate`); mark `revenue_processing_log` entry (keyed on `bookingId`) as `SUCCESS` |

> **Idempotency**: Analytics Service should skip if `revenue_processing_log` already has an entry for this `bookingId` with `paymentStatus = SUCCESS`.

---

### `TicketIssued` ✅ [EXISTS IN MONOLITH — needs Kafka adaptation]

> Monolith equivalent: `TicketCreatedEvent` — fired by `TicketServiceImpl.createTickets()` after tickets are saved. Handled by `NotificationEventListener.handleTicketCreatedEvent()` which sends QR-code email.

- **Topic**: `cinema.booking.ticket-issued`
- **Publisher**: Booking Service
- **Consumers**: Notification Service
- **Trigger**: `TicketServiceImpl.createTickets(bookingId)` successfully saves all tickets. Only fired when `booking.customer != null` (not guest bookings without email).
- **Payload** *(adapted from `TicketCreatedEvent` + email context from `NotificationEventListener`)*:

```json
{
  "bookingId":   "uuid",
  "accountId":   "uuid — the customer's account ID (used to look up email)",
  "customerId":  "uuid",
  "customerEmail":"string",
  "movieTitle":  "string — for the email subject",
  "cinemaName":  "string",
  "showTime":    "ISO-8601 UTC",
  "tickets": [
    {
      "ticketId":   "uuid",
      "ticketCode": "string — alphanumeric code for QR generation",
      "seatName":   "string — e.g. A5",
      "seatType":   "string — e.g. VIP",
      "price":      "number — VND"
    }
  ],
  "totalAmount": "number — VND"
}
```

> In the monolith, the `ticketIds` are sent and the listener re-queries the DB. In the microservice design, we embed the full ticket data to avoid cross-service DB calls.

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Notification Service | Generate QR PNG for each `ticketCode`; build ticket email from `EmailType.TICKET_ISSUE` template; send via Brevo SMTP with QR attachments |

---

### `LoyaltyPointsEarned` ⚠️ [TO BE IMPLEMENTED]

> Monolith equivalent: `BookingServiceImpl.confirmBookingPayment()` calls `customerService.addLoyaltyPoints()` **directly** (synchronous in-process call). No event.

- **Topic**: `cinema.booking.loyalty-points-earned`
- **Publisher**: Booking Service
- **Consumers**: Identity Service
- **Trigger**: Tickets created and loyalty points calculated after payment confirmed. Published alongside `TicketIssued`.
- **Payload** *(based on `DiscountService.calculateEarnedPoints()` and `caculateDiscountPoints()`)*:

```json
{
  "customerId":     "uuid",
  "bookingId":      "uuid",
  "pointsEarned":   "int — floor(totalAmount / 20000)",
  "pointsRedeemed": "int — floor(discount / 1000), 0 if no redemption",
  "netPoints":      "int — pointsEarned - pointsRedeemed (can be negative on refund)",
  "totalAmount":    "number — VND, used to compute points",
  "discount":       "number — VND loyalty discount applied to this booking",
  "isRefund":       "boolean — true when triggered by refund (points are subtracted)"
}
```

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Identity Service | Add `netPoints` to `customer.loyaltyPoints` (positive = credit, negative = debit) |

---

### `InvoiceRefunded` ⚠️ [TO BE IMPLEMENTED]

> Monolith equivalent: `InvoiceRefundedEvent` — Spring Application Event fired by `InvoiceServiceImpl.updateInvoiceStatus()` when status is set to `REFUNDED`. Triggers a refund confirmation email via `NotificationEventListener`.

- **Topic**: `cinema.payment.invoice-refunded`
- **Publisher**: Payment Service
- **Consumers**: Booking Service, Analytics Service, Notification Service
- **Trigger**: `PATCH /invoices/{id}/status?status=REFUNDED` successfully completes.
- **Payload**:

```json
{
  "eventId":    "uuid",
  "eventType":  "InvoiceRefunded",
  "occurredAt": "ISO-8601 UTC",
  "source":     "payment-service",
  "payload": {
    "invoiceId":           "uuid",
    "bookingId":           "uuid",
    "customerId":          "uuid | null",
    "customerEmail":       "string | null — stored by Payment Service from BookingCreated event",
    "refundAmount":        "number — VND amount refunded",
    "originalPaymentDate": "date (yyyy-MM-dd) — the paidAt date of the original SUCCESS payment; Analytics must subtract from THIS date bucket, not today",
    "refundedAt":          "ISO-8601 UTC"
  }
}
```

- **Consumer Actions**:

| Consumer | Action on receive |
|----------|------------------|
| Booking Service | Set `booking.status = REFUNDED`; release all `seat_reservation` records → `AVAILABLE`; reverse loyalty points (publish negative `LoyaltyPointsEarned`) |
| Analytics Service | Subtract revenue from `daily_revenue_summary` and `movie_revenue` for the `originalPaymentDate` bucket; idempotency check on `invoiceId + "REFUND"` |
| Notification Service | Send refund confirmation email to `customerEmail` |

---

### Internal-Only Events (Monolith — Not Kafka candidates)

The following Spring Application Events handle **notification emails only within the monolith**. In the microservice architecture, these would be replaced by direct REST calls from Identity Service to Notification Service at the time of account creation, OR by domain events on an `identity.*` topic.

| Mono Event | When | Notification Sent |
|-----------|------|------------------|
| `PasswordResetEvent` | OTP requested | OTP email with reset link |
| `CustomerCreatedEvent` | Customer account created | Welcome email with credentials |
| `StaffCreatedEvent` | Staff account created | Welcome email with credentials |

> `InvoiceRefundedEvent` has been **promoted** to a full Kafka event (`cinema.payment.invoice-refunded`) above — it is no longer internal-only.

---

## 4. Error Handling Strategy

### Current Monolith (Spring Application Events)

| Concern | Current Behavior |
|---------|----------------|
| **Retry** | None — if a `@TransactionalEventListener` method throws, the exception is logged and the event is lost. No retry. |
| **DLQ** | None — no dead letter queue of any kind. |
| **Idempotency** | None — no `eventId`, no processed-event log. Duplicate events are possible if the handler is retried manually. |
| **Async** | `@Async` on listener methods; failures don't roll back the triggering transaction (AFTER_COMMIT phase). |

---

### Target Kafka Design (Microservices)

#### Retry Policy
```
Retry attempts:    3
Backoff:           Exponential — 1s, 2s, 4s
After exhaustion:  Route to DLQ topic
```

Proposed per-topic DLQ naming:
```
cinema.catalog.screening-created.DLQ
cinema.booking.booking-created.DLQ
cinema.payment.payment-confirmed.DLQ
... etc.
```

#### DLQ Configuration (Spring Kafka `@KafkaListener` pattern)
```java
@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 1000, multiplier = 2),
    dltTopicSuffix = ".DLQ"
)
@KafkaListener(topics = "cinema.payment.payment-confirmed", groupId = "booking-service")
public void handlePaymentConfirmed(PaymentConfirmedEvent event) { ... }
```

#### Idempotency Strategy

| Consumer | Idempotency Mechanism |
|----------|----------------------|
| Booking Service (`PaymentConfirmed`) | Check `booking.status == PENDING` before processing; if already `PAID`, skip. Use DB unique constraint on `booking.id`. |
| Booking Service (`ScreeningCreated`) | Check if `seat_reservation` records already exist for `screeningId`; use `INSERT ... ON CONFLICT DO NOTHING`. |
| Analytics Service (`PaymentConfirmed`) | Maintain a `processed_events(eventId, processedAt)` table; skip if `eventId` already recorded. |
| Notification Service (all events) | Store `notification_log(eventId, channel, sentAt)`; skip if `eventId` already present. |
| Identity Service (`LoyaltyPointsEarned`) | Use `bookingId` as idempotency key in a `loyalty_ledger(bookingId, netPoints)` table; skip if `bookingId` already exists. |

#### Consumer Group IDs

| Topic | Consumer | Group ID |
|-------|----------|----------|
| `cinema.catalog.screening-created` | Booking Service | `booking-service` |
| `cinema.catalog.screening-cancelled` | Booking Service | `booking-service` |
| `cinema.booking.booking-created` | Payment Service | `payment-service` |
| `cinema.booking.booking-created` | Notification Service | `notification-service` |
| `cinema.booking.booking-cancelled` | Payment Service | `payment-service` |
| `cinema.booking.booking-cancelled` | Notification Service | `notification-service` |
| `cinema.payment.payment-confirmed` | Booking Service | `booking-service` |
| `cinema.payment.payment-confirmed` | Analytics Service | `analytics-service` |
| `cinema.payment.payment-confirmed` | Notification Service | `notification-service` |
| `cinema.payment.payment-failed` | Booking Service | `booking-service` |
| `cinema.payment.payment-failed` | Notification Service | `notification-service` |
| `cinema.booking.ticket-issued` | Notification Service | `notification-service` |
| `cinema.booking.loyalty-points-earned` | Identity Service | `identity-service` |

---

## 5. Kafka Topic Summary

| Topic | Publisher | Consumers | Status |
|-------|-----------|-----------|--------|
| `cinema.catalog.screening-created` | Catalog Service | Booking Service | [TO BE IMPLEMENTED] |
| `cinema.catalog.screening-cancelled` | Catalog Service | Booking Service | [TO BE IMPLEMENTED] |
| `cinema.booking.booking-created` | Booking Service | Payment, Notification | [TO BE IMPLEMENTED] |
| `cinema.booking.booking-cancelled` | Booking Service | Payment, Notification | [TO BE IMPLEMENTED] |
| `cinema.booking.ticket-issued` | Booking Service | Notification | Mono has `TicketCreatedEvent` — adapt to Kafka |
| `cinema.booking.loyalty-points-earned` | Booking Service | Identity | [TO BE IMPLEMENTED] |
| `cinema.payment.payment-confirmed` | Payment Service | Booking, Analytics, Notification | [TO BE IMPLEMENTED] |
| `cinema.payment.payment-failed` | Payment Service | Booking, Notification | [TO BE IMPLEMENTED] |

---

## Appendix: Monolith Call Graph (Current Synchronous Flow)

```
POST /payment/vnpay-ipn  (VNPay callback)
  └─ PaymentServiceImpl.handleVNPayIPN()
       ├─ Invoice.status = PAID
       ├─ Payment record saved
       ├─ bookingService.confirmBookingPayment(bookingId)     ← SYNC call
       │    ├─ Booking.status = PAID
       │    ├─ screeningSeat.status = SOLD (all seats)
       │    ├─ ticketService.createTickets(bookingId)
       │    │    ├─ Ticket records saved
       │    │    └─ eventPublisher.publishEvent(TicketCreatedEvent)
       │    │         └─ [ASYNC] NotificationEventListener.handleTicketCreatedEvent()
       │    │               └─ Send QR-code email via Brevo
       │    └─ customerService.addLoyaltyPoints()             ← SYNC call
       └─ revenueAggregationService.aggregateRevenue()        ← SYNC call
            ├─ DailyRevenueSummary upserted
            └─ MovieRevenue upserted

POST /invoices/{id}/update status=REFUNDED
  └─ InvoiceServiceImpl.updateInvoiceStatus(REFUNDED)
       ├─ bookingService.refundBooking(bookingId)             ← SYNC call
       │    ├─ Booking.status = REFUNDED
       │    ├─ ticketService.expireTicketsByBookingId()
       │    └─ customerService.addLoyaltyPoints(negative)     ← SYNC call
       ├─ revenueAggregationService.processInvoiceRefundForRevenue()
       └─ eventPublisher.publishEvent(InvoiceRefundedEvent)
            └─ [ASYNC] NotificationEventListener.handleInvoiceRefundedEvent()
                  └─ Send refund email via Brevo
```

> In the microservice architecture, every SYNC call between services above becomes a Kafka event (async) or a REST/Feign call if a synchronous response is strictly needed.

---

*Updated: 2026-06-20 | Source: all event classes under `*/event/`, `NotificationEventListener`, `BookingServiceImpl`, `TicketServiceImpl`, `PaymentServiceImpl`, `InvoiceServiceImpl`, `application.yml`*
