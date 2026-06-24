# Shared Enums & Common Types

> **Source**: Extracted by reading every Java enum file under `src/main/java/...` on 2026-06-20.
> All values are taken directly from source code — no values are guessed.

---

## 1. Enums per Service

Enums are grouped according to the **target microservice** they will belong to (as defined in `service-boundaries.md`), even though in the current monolith they live in different packages.

---

### Identity Service
> Package root in mono: `authentication`, `common.enums` (Role, Gender)

#### `AccountType`
> `authentication/enums/AccountType.java`

| Value | Description |
|-------|-------------|
| `INTERNAL` | Staff / admin account — can log in via `/auth/admin/login` |
| `CUSTOMER` | Customer account — can log in via `/auth/customer/login` |

---

#### `Gender`
> `common/enums/Gender.java` — used on both `Customer` and `Staff` entities

| Value | Description |
|-------|-------------|
| `MALE` | Male gender |
| `FEMALE` | Female gender |
| `OTHER` | Other / not specified |

---

#### `Role` *(utility enum — not the entity)*
> `common/enums/Role.java`

| Value | Description |
|-------|-------------|
| `ADMIN` | Super-admin role (system-level) |
| `USER` | Generic user role |

> **Note**: This is a simple utility enum. The actual RBAC roles are stored as free-text `String` records in the `roles` table and seeded from `PredefinedRole` constants (see Section 3).

---

### Catalog Service
> Package root in mono: `movie`, `room`, `screening`, `common.enums` (MovieStatus, RoomType, DayType, TimeSlot)

#### `MovieStatus`
> `common/enums/MovieStatus.java`

| Value | Description |
|-------|-------------|
| `coming_soon` | Movie has been registered but not yet released; shown in coming-soon listings |
| `now_showing` | Movie is currently screening; shown in now-showing listings and available for booking |
| `archived` | Movie has ended its run; cannot be booked; hidden from public listings |

> **Note**: Values use `snake_case` (lowercase), which is unusual. Queries like `GET /movies/status/{status}` must pass `now_showing`, not `NOW_SHOWING`.

---

#### `DayType`
> `common/enums/DayType.java` — used in `PriceConfig` for pricing dimension

| Value | Description |
|-------|-------------|
| `WEEKDAY` | Monday – Friday; resolved automatically via `DayType.from(LocalDate)` |
| `WEEKEND` | Saturday or Sunday; resolved automatically via `DayType.from(LocalDate)` |

> **Note**: `HOLIDAY` is mentioned in `service-boundaries.md` design notes but **does NOT exist in the actual enum**. The code only has `WEEKDAY` and `WEEKEND`.

---

#### `TimeSlot`
> `common/enums/TimeSlot.java` — used in `PriceConfig` for pricing dimension

| Value | Time Range | Description |
|-------|------------|-------------|
| `MORNING` | 06:00 – 12:00 | Morning screenings |
| `AFTERNOON` | 12:00 – 18:00 | Afternoon screenings |
| `EVENING` | 18:00 – 23:00 | Evening / prime-time screenings |
| `LATE_NIGHT` | 23:00 – 06:00 | Late-night screenings (wraps midnight) |

> **Note**: The spec document references a `NIGHT` value, but the actual code uses `LATE_NIGHT`.

---

#### `RoomType`
> `common/enums/RoomType.java`

| Value | Description |
|-------|-------------|
| `STANDARD` | Standard cinema room |
| `IMAX` | IMAX large-format room |
| `FOUR_DX` | 4DX immersive experience room |
| `GOLD_CLASS` | Gold Class / premium luxury seating room |

> *Values verified from `RoomType.java` on 2026-06-21.*

---

#### `RoomStatus`
> `room/enums/RoomStatus.java`

| Value | Description |
|-------|-------------|
| `ACTIVE` | Room is operational and available for scheduling |
| `INACTIVE` | Room is temporarily out of service |
| `MAINTENANCE` | Room is undergoing maintenance; cannot schedule screenings |

---

#### `ScreeningStatus`
> `screening/enums/ScreeningStatus.java`

| Value | Description |
|-------|-------------|
| `SCHEDULED` | Screening is planned; seats are open for booking; can still be edited/cancelled |
| `ONGOING` | Screening is currently in progress |
| `COMPLETED` | Screening has finished |
| `CANCELED` | Screening was cancelled (note: single-`l` spelling in code) |

---

### Booking Service
> Package root in mono: `booking`, `screeningSeat`, `ticket`

#### `BookingStatus`
> `booking/enums/BookingStatus.java`

| Value | Description |
|-------|-------------|
| `PENDING` | Booking created; seats are locked; awaiting payment (hold expires in 10 min) |
| `CONFIRM` | Booking has been confirmed (intermediate state after payment intent) |
| `PAID` | Payment received; tickets have been generated |
| `EXPIRED` | Booking hold timed out without payment; seats released |
| `CANCELLED` | Customer or admin cancelled the booking |
| `REFUNDED` | Booking was refunded after payment |

---

#### `ScreeningSeatStatus`
> `screeningSeat/enums/ScreeningSeatStatus.java`

| Value | Description |
|-------|-------------|
| `AVAILABLE` | Seat is open and can be selected |
| `LOCKED` | Seat is temporarily reserved during booking flow (TTL-based, 10 minutes) |
| `SOLD` | Seat has been purchased and a ticket issued |

> **Note**: The spec document uses `BOOKED` as a value, but the actual enum uses `SOLD`.

---

#### `TicketStatus`
> `ticket/enums/TicketStatus.java`

| Value | Description |
|-------|-------------|
| `ACTIVE` | Ticket is valid and ready for check-in |
| `USED` | Ticket was checked in; `usedAt` is set |
| `CANCELLED` | Ticket was cancelled (e.g., due to booking cancellation) |
| `EXPIRED` | Ticket passed its `expiresAt` timestamp without being used |
| `FOR_TRANSFER` | Ticket has been marked for transfer to another customer |

---

### Payment Service
> Package root in mono: `payment`

#### `InvoiceStatus`
> `payment/entity/InvoiceStatus.java`

| Value | Description |
|-------|-------------|
| `PENDING` | Invoice created; waiting for payment |
| `PAID` | Payment received; `paidAt` timestamp set |
| `FAILED` | Payment attempt failed |
| `REFUNDED` | Invoice amount has been refunded |

---

#### `PaymentStatus`
> `payment/enums/PaymentStatus.java`

| Value | Description |
|-------|-------------|
| `PENDING` | Payment transaction initiated; awaiting gateway callback |
| `SUCCESS` | Payment was successful (VNPay IPN confirmed) |
| `FAILED` | Payment gateway returned failure |
| `CANCELLED` | Payment was cancelled (by user or timeout) |
| `REFUNDED` | Payment amount has been reversed |

---

#### `PaymentType`
> `payment/entity/PaymentType.java`

| Value | Description |
|-------|-------------|
| `BOOKING` | Payment for a new booking (debit from customer) |
| `REFUND` | Refund transaction (credit back to customer) |

> **Note**: There is no separate `PaymentMethod` enum. Payment methods (`VNPay`, `Cash`, etc.) are stored as dynamic records in the `payment_methods` table — not an enum.

---

### Notification Service
> Package root in mono: `notification`

#### `NotificationStatus`
> `notification/enums/NotificationStatus.java`

| Value | Description |
|-------|-------------|
| `PENDING` | Notification has been created; not yet sent |
| `SENT` | Notification was dispatched to the delivery channel |
| `READ` | In-app notification was read by the user |
| `FAILED` | Delivery failed (email bounce, etc.) |

---

#### `NotificationCategory`
> `notification/enums/NotificationCategory.java`

| Value | Built-in Description |
|-------|----------------------|
| `BOOKING` | "Booking notifications — tickets, confirmations, cancellations" |
| `SYSTEM` | "System notifications — maintenance, updates, announcements" |

---

#### `EmailType`
> `notification/enums/EmailType.java` — selects the Brevo email template to use

| Value | Description |
|-------|-------------|
| `RESET_PASSWORD` | Password reset email with OTP link |
| `WELCOME_STAFF` | Welcome email sent to newly created staff accounts |
| `NOTIFICATION_EMAIL` | Generic notification email |
| `TICKET_ISSUE` | Email containing ticket QR codes after booking is paid |
| `WELCOME_CUSTOMER` | Welcome email sent to newly registered customers |
| `REFUND_NOTIFICATION` | Email notifying customer of a refund |

---

#### `Priority`
> `notification/enums/Priority.java` — notification delivery priority

| Value | Description |
|-------|-------------|
| `URGENT` | Must be delivered immediately (e.g., payment failure) |
| `HIGH` | High-priority but not critical |
| `NORMAL` | Standard notification |

---

#### `RecipientType`
> `notification/enums/RecipientType.java`

| Value | Description |
|-------|-------------|
| `STAFF` | Notification targets a staff/admin account |
| `CUSTOMER` | Notification targets a customer account |

---

### Analytics Service
> Package root in mono: `revenue`

#### `ReportType`
> `revenue/enums/ReportType.java`

| Value | Description |
|-------|-------------|
| `DAILY` | Revenue aggregated per day |
| `WEEKLY` | Revenue aggregated per week |
| `MONTHLY` | Revenue aggregated per month |
| `YEARLY` | Revenue aggregated per year |
| `CUSTOM` | Arbitrary date range report (`fromDate` – `toDate`) |

---

### Cross-cutting / Monolith-only
*Enums in modules that are **excluded** from the microservice scope (per `service-boundaries.md`) but exist in the current codebase.*

#### `VoteType`
> `review/entity/VoteType.java` — Review module (excluded from microservice scope)

| Value | Description |
|-------|-------------|
| `HELPFUL` | User found the review helpful |
| `UNHELPFUL` | User found the review not helpful |

---

#### `DocumentStatus`
> `chatbotInternal/enums/DocumentStatus.java` — Chatbot module (excluded from microservice scope)

| Value | Description |
|-------|-------------|
| `ACTIVE` | Document is indexed and available for RAG queries |
| `INACTIVE` | Document is disabled |
| `PROCESSING` | Document is being parsed and embedded |
| `FAILED` | Document processing failed |

---

#### `DocumentType`
> `chatbotInternal/enums/DocumentType.java` — Chatbot module (excluded from microservice scope)

| Value | Description |
|-------|-------------|
| `POLICY` | Company policy document |
| `GUIDELINE` | Operational guideline document |
| `FAQ` | Frequently Asked Questions |
| `HANDBOOK` | Staff handbook |

---

## 2. Shared Value Objects

There is **no explicit `Money` or `Address` value object** in the codebase. Below are the de-facto shared patterns used across multiple entities.

---

### Price Representation
All monetary amounts in the system use `java.math.BigDecimal` stored in VND (Vietnamese Dong). There is no wrapper class or currency field — the currency is implicitly VND everywhere.

| Usage | Entity / Field | Type |
|-------|----------------|------|
| Ticket base price | `PriceConfig.price` | `BigDecimal` |
| Seat type multiplier | `SeatType.basePriceModifier` | `BigDecimal` |
| Booking subtotal / discount / total | `Booking.subtotal`, `.discount`, `.totalAmount` | `BigDecimal` |
| Invoice amount | `Invoice.totalAmount` | `BigDecimal` |
| Payment amount | `Payment.amount` | `BigDecimal` |
| Combo price | `Combo.price` | `BigDecimal` |
| Revenue figures | `RevenueReport.totalRevenue`, `DailyRevenueSummary.totalRevenue`, `MovieRevenue.revenue` | `BigDecimal` |

---

### `BaseEntity` — Common Audit Fields
> `common/entity/BaseEntity.java` — extended by virtually all JPA entities

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (UUID via `@GeneratedValue`) | Primary key |
| `createdAt` | `LocalDateTime` | Auto-set on insert (`@CreationTimestamp`) |
| `updatedAt` | `LocalDateTime` | Auto-updated on every save (`@UpdateTimestamp`) |
| `deleted` | `Boolean` (default `false`) | Soft-delete flag; enforced by `@SQLDelete` + `@Where(deleted = false)` |

---

### Address
No dedicated `Address` value object exists. Address is stored as a flat `String` field directly on `Customer`, `Staff`, and `Cinema` entities.

---

### DateRange
No `DateRange` value object exists. Date ranges are always passed as separate `fromDate` / `toDate` query parameters (e.g., on revenue endpoints).

---

## 3. Constants & Business Limits

### `PredefinedRole`
> `constant/PredefinedRole.java`

| Constant | Value | Used In | Meaning |
|----------|-------|---------|---------|
| `STAFF_ROLE` | `"STAFF"` | RBAC seed data, security config | Default role for cinema staff |
| `ADMIN_ROLE` | `"ADMIN"` | RBAC seed data, security config | Super-admin role |
| `CUSTOMER_ROLE` | `"CUSTOMER"` | RBAC seed data, security config | Default role for registered customers |
| `MANAGER_ROLE` | `"MANAGER"` | RBAC seed data, security config | Cinema branch manager role |

---

### Booking Limits
> `booking/service/BookingServiceImpl.java`

| Constant | Value | Used In | Meaning |
|----------|-------|---------|---------|
| `MAX_SEATS_PER_BOOKING` *(hardcoded inline)* | `8` | `BookingServiceImpl.createBooking()` | A single booking cannot select more than 8 seats (`BOOKING_EXCEED_SEAT_LIMIT` error if exceeded) |
| `HOLD_DURATION` | `Duration.ofMinutes(10)` | `BookingServiceImpl.createBooking()` | Seat lock TTL; booking `expiredAt = createdAt + 10 min` |

---

### Loyalty Points / Discount Rules
> `booking/service/DiscountService.java`

| Constant | Value | Used In | Meaning |
|----------|-------|---------|---------|
| `RATE` | `1000` (VND per point) | `caculateDiscountPoints()` | 1 loyalty point = 1,000 VND discount |
| `MAX_PERCENTAGE_DISCOUNT` | `50` (%) | `applyDiscounts()` | Loyalty point redemption cannot exceed 50% of the booking subtotal |
| `TOTAL_AMOUNT_RATE_TO_POINT` | `20000` (VND per point earned) | `calculateEarnedPoints()` | Customer earns 1 point for every 20,000 VND spent |

**Derived rule:**
- Points earned: `floor(totalAmount / 20,000)`
- Points cost: `1 point = 1,000 VND discount`
- Max redeemable discount: `50%` of subtotal

---

### Invoice
> `payment/service/InvoiceServiceImpl.java`

| Constant | Value | Used In | Meaning |
|----------|-------|---------|---------|
| `INVOICE_EXPIRY_DAYS` | `7` days | `InvoiceServiceImpl` | Invoices expire 7 days after creation *(defined but not yet actively enforced in a scheduler)* |

---

### JWT & OTP Durations
> `src/main/resources/application.yml`

| Config Key | Value | Meaning |
|------------|-------|---------|
| `jwt.valid-duration` | `36000` seconds (10 hours) | Access token validity |
| `jwt.refreshable-duration` | `36000` seconds (10 hours) | Refresh window (same as valid-duration) |
| `otp.valid-duration` | `10` minutes | OTP code expiry for password reset |

---

### Redis Key Patterns (Seat Lock)
> Defined in `service-boundaries.md`; implemented in Booking Service

| Key Pattern | TTL | Meaning |
|-------------|-----|---------|
| `seat:lock:{screeningId}:{seatId}` | 10 min | Temporary seat hold during booking checkout |
| `catalog:movie:{movieId}` | 5 min | Cached movie data |
| `catalog:screening:{screeningId}` | 5 min | Cached screening data |
| `catalog:cinema:{cinemaId}` | 10 min | Cached cinema data |
| `booking:session:{bookingId}` | 15 min | Pending booking session |

---

## Appendix: Enum Location Map

| Enum | File Path (relative to `src/main/java/...`) | Monolith Package |
|------|---------------------------------------------|------------------|
| `AccountType` | `authentication/enums/AccountType.java` | Identity |
| `Gender` | `common/enums/Gender.java` | Identity / Catalog |
| `Role` *(utility)* | `common/enums/Role.java` | Identity |
| `MovieStatus` | `common/enums/MovieStatus.java` | Catalog |
| `DayType` | `common/enums/DayType.java` | Catalog |
| `TimeSlot` | `common/enums/TimeSlot.java` | Catalog |
| `RoomType` | `common/enums/RoomType.java` | Catalog |
| `RoomStatus` | `room/enums/RoomStatus.java` | Catalog |
| `ScreeningStatus` | `screening/enums/ScreeningStatus.java` | Catalog |
| `BookingStatus` | `booking/enums/BookingStatus.java` | Booking |
| `ScreeningSeatStatus` | `screeningSeat/enums/ScreeningSeatStatus.java` | Booking |
| `TicketStatus` | `ticket/enums/TicketStatus.java` | Booking |
| `InvoiceStatus` | `payment/entity/InvoiceStatus.java` | Payment |
| `PaymentStatus` | `payment/enums/PaymentStatus.java` | Payment |
| `PaymentType` | `payment/entity/PaymentType.java` | Payment |
| `NotificationStatus` | `notification/enums/NotificationStatus.java` | Notification |
| `NotificationCategory` | `notification/enums/NotificationCategory.java` | Notification |
| `EmailType` | `notification/enums/EmailType.java` | Notification |
| `Priority` | `notification/enums/Priority.java` | Notification |
| `RecipientType` | `notification/enums/RecipientType.java` | Notification |
| `ReportType` | `revenue/enums/ReportType.java` | Analytics |
| `VoteType` | `review/entity/VoteType.java` | *(excluded)* |
| `DocumentStatus` | `chatbotInternal/enums/DocumentStatus.java` | *(excluded)* |
| `DocumentType` | `chatbotInternal/enums/DocumentType.java` | *(excluded)* |
| `ErrorCode` | `common/exception/ErrorCode.java` | Cross-cutting |

---

*Updated: 2026-06-20 | Source: direct code read of all enum files under `src/`*
