# Spec Consistency Validation Report

> **Source**: Cross-read of all 11 spec files on 2026-06-21.
> **Method**: Strict — every field name, enum value, and endpoint reference was verified against the spec that owns it.
> **Status legend**: ✅ Match | ⚠️ Minor gap / design-only mismatch | ❌ Conflict / broken

---

## Fix Status (post-fix runs)

| Fix Round | Issues Addressed | Status |
|-----------|-----------------|--------|
| **FIX-01** | Enum conflicts: `RoomType` values corrected from source, `TimeSlot.NIGHT → LATE_NIGHT`, `DayType.HOLIDAY` removed | ✅ Done |
| **FIX-02** | Kafka payload enrichment: `PaymentConfirmed` + `customerEmail`, `BookingPaid` fields, `priceSnapshot → price` | ✅ Done |
| **FIX-03** | Identity Service spec created; loyalty-points endpoint documented; `refreshToken()` bug flagged | ✅ Done |
| **FIX-04** | Security gaps documented in specs: ADMIN guards on write endpoints, catch-all 400→500 fix, secrets to env vars | ✅ Done |
| **FIX-05** | ErrorCode numeric ranges defined; duplicate `2036` resolved; excluded module codes marked `[EXCLUDED]`; catalog-service-spec §11 reconciled | ✅ Done |
| **FIX-06** | Open questions resolved: Q1 (HOLIDAY not in scope), Q8 (VNPay Return read-only), Q9 (CONFIRM deprecated), Q12 (Redis healthcheck), Q14 (Analytics → REST for cinema list) | ✅ Done |

> Specs are now ready for implementation.
> Run the D-1 validation prompt again to confirm all ❌ items are resolved before starting service scaffolding.

---

## 1. Kafka Event Consistency

Cross-checking every event's payload as defined by the **publisher's spec** against what the **consumer's spec** expects to read.

---

### 1.1 `ScreeningCreated` — `cinema.catalog.screening-created`

**Publisher**: Catalog Service (catalog-service-spec.md §7)
**Consumer**: Booking Service (booking-service-spec.md §2.2 SeatReservation)

| Field in Publisher Payload | Consumer Expects | Match? | Issue |
|---------------------------|-----------------|--------|-------|
| `screeningId` | `screening_id` column | ✅ | |
| `movieId` | consumed? | ⚠️ | booking-spec does not use `movieId` from this event directly — stores in `Booking.screeningId` (String). No issue at event-receive time. |
| `movieTitle` | `Booking.movieTitle` (microservice) | ✅ | Catalog-spec §7.2 adds it as NEW; Booking-spec §2.2 expects it. |
| `cinemaId` | `Booking.cinemaId` (microservice) | ✅ | Both denormalized. |
| `cinemaName` | `Booking.cinemaName` (microservice) | ✅ | Both denormalized. |
| `roomId` | not stored in SeatReservation | ⚠️ | `roomId` is in the event but Booking Service does not have a `roomId` column on `seat_reservation`. Booking stores `roomName` on `Booking` entity. Not a breaking mismatch — consumer just ignores it. |
| `seats[].seatId` | `seat_reservation.seat_id` | ✅ | |
| `seats[].seatName` | `seat_reservation.seat_name` | ✅ | |
| `seats[].seatTypeId` | `seat_reservation.seat_type_id` | ✅ | |
| `seats[].seatTypeName` | `seat_reservation.seat_type_name` | ✅ | |
| `seats[].price` (field name in kafka-event-schema.md) | `seat_reservation.price` | ✅ | |
| `seats[].priceSnapshot` (field name in kafka-event-schema.md §3) | — | ❌ | **CONFLICT**: kafka-event-schema.md §3 calls this field `priceSnapshot`; catalog-service-spec.md §7 calls it `price`. Both specs are authored independently and disagree on the field name. Booking Service must know the actual field name to deserialize. **Decision needed: standardize to `price`.** |
| `dayType` / `timeSlot` | not used by SeatReservation | ✅ | Booking Service ignores these; Analytics Service doesn't receive this event. |
| `startTime` | `seat_reservation.createdAt` (only via Booking entity) | ⚠️ | `startTime` is in the event but `SeatReservation` entity has no `startTime` column. Used only when constructing the `Booking` entity. No data loss. |

**Verdict**: ⚠️ **1 field name conflict** (`priceSnapshot` vs `price`) between kafka-event-schema.md and catalog-service-spec.md.

---

### 1.2 `ScreeningCancelled` — `cinema.catalog.screening-cancelled`

**Publisher**: Catalog Service (catalog-service-spec.md §8)
**Consumer**: Booking Service (service-boundaries.md)

| Field in Publisher Payload | Consumer Expects | Match? | Issue |
|---------------------------|-----------------|--------|-------|
| `screeningId` | Used to query `seat_reservation WHERE screening_id = ?` | ✅ | |
| `movieId`, `cinemaId`, `startTime`, `reason` | Not used by consumer action | ✅ | Consumer only needs `screeningId`. Extra fields are informational. |

**Verdict**: ✅ Consistent.

---

### 1.3 `BookingCreated` — `cinema.booking.booking-created`

**Publisher**: Booking Service (kafka-event-schema.md §3, booking-service-spec.md §8 implied)
**Consumers**: Payment Service (payment-service-spec.md §8.2), Notification Service (notification-service-spec.md)

| Field in Publisher Payload | Payment Expects | Notification Expects | Match? | Issue |
|---------------------------|----------------|---------------------|--------|-------|
| `bookingId` | `invoice.bookingId` | — | ✅ | |
| `totalAmount` | `invoice.totalAmount` | — | ✅ | |
| `customerId` | not used at invoice creation | notification recipient | ✅ | |
| `customerEmail` | not used | notification channel | ✅ | |
| `movieTitle` | not used | email body | ✅ | |
| `cinemaName` | not used | email body | ✅ | |
| `subtotal`, `discount` | not used | not used | ⚠️ | Present in payload but no consumer uses them. Not a problem — extra fields are ignored. |
| `seatNames` | not used | email body | ✅ | |
| `combos[]` | not used | email body | ✅ | |
| `expiredAt` | not used | not used | ⚠️ | Included in event schema but no consumer documents using it. Consider whether Notification Service should show "expires at" in the pending-payment email. |

**Payment Consumer Action** (payment-spec §8.2): "Auto-create Invoice for the booking"
→ Reads `event.getPayload().getBookingId()` and `event.getPayload().getTotalAmount()`
→ These fields are ✅ present in the BookingCreated payload.

**Verdict**: ✅ Consistent. Minor: `expiredAt` sent but not used by any documented consumer.

---

### 1.4 `BookingCancelled` — `cinema.booking.booking-cancelled`

**Publisher**: Booking Service (kafka-event-schema.md §3)
**Consumers**: Payment Service (payment-spec §8.2), Notification Service

| Field | Payment Expects | Notification Expects | Match? | Issue |
|-------|----------------|---------------------|--------|-------|
| `bookingId` | used to find invoice | used | ✅ | |
| `customerId`, `customerEmail` | not used | used | ✅ | |
| `totalAmount` | not used | not used | ⚠️ | |
| `cancelledAt` | not used | not used | ⚠️ | |
| `reason` | not used | not used | ⚠️ | |

**Payment Consumer Action**: "Mark invoice `FAILED` if still `PENDING`"
→ Needs `bookingId` to find invoice → ✅ present.

**Verdict**: ✅ Consistent.

---

### 1.5 `PaymentConfirmed` — `cinema.payment.payment-confirmed`

**Publisher**: Payment Service (payment-service-spec.md §8.1)
**Consumers**: Booking Service, Analytics Service, Notification Service

#### Publisher payload:
```
bookingId, invoiceId, paymentId, transactionCode, amountPaid, paymentMethod, paidAt
```

#### Cross-check against each consumer's documented needs:

**Booking Service** (booking-service-spec.md, service-boundaries.md):
| Field Needed | Available in Event? | Issue |
|-------------|---------------------|-------|
| `bookingId` | ✅ | |
| Status update trigger | ✅ (consumer action: set `booking.status = PAID`) | |
| Loyalty points calculation needs `totalAmount` | ⚠️ | `amountPaid` is present — that's the same value. Field renamed but semantically equivalent. |

**Analytics Service** (analytics-service-spec.md §7.1):
| Field Needed | Available in Event? | Issue |
|-------------|---------------------|-------|
| `paymentId` (idempotency key) | ✅ | |
| `cinemaId` | ❌ **MISSING** | analytics-spec §7.1 requires `cinemaId` for `daily_revenue_summary` key. Payment service's `PaymentConfirmed` payload does NOT include `cinemaId`. Analytics Service cannot aggregate by cinema without it. |
| `movieId` | ❌ **MISSING** | analytics-spec §7.1 requires `movieId` for `movie_revenue` key. Not in the event. |
| `ticketRevenue` | ❌ **MISSING** | analytics-spec §7.1 requires pre-split `ticketRevenue`. Only `amountPaid` (total) is present. |
| `comboRevenue` | ❌ **MISSING** | analytics-spec §7.1 requires `comboRevenue` separately. Not in the event. |
| `totalTicketsSold` | ❌ **MISSING** | analytics-spec §7.1 requires seat count. Not in the event. |
| `paidAt` | ✅ (as `paidAt` in event) | |

> ❌ **CRITICAL GAP**: The `PaymentConfirmed` event as documented in `payment-service-spec.md` is insufficient for the Analytics Service. The Analytics spec (§7.1 "Required payload fields") documents exactly what additional fields are needed from the event: `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold`. The Payment Service's event design does NOT include them.
>
> **Root cause**: Payment Service doesn't have this data — it only owns `invoiceId`, `bookingId`, `amount`. The Booking Service has `movieId`, `cinemaId`, `ticketRevenue/comboRevenue` split. Two options:
> 1. Booking Service publishes a separate `BookingRevenueSnapshot` event after payment confirmation.
> 2. Payment Service queries Booking Service via REST to get these fields before publishing `PaymentConfirmed`.
> 3. `PaymentConfirmed` event is enriched by Analytics Service consuming `BookingCreated` first (then joining by `bookingId`).

**Notification Service** (notification-service-spec.md):
| Field Needed | Available? | Issue |
|-------------|------------|-------|
| `customerEmail` | ❌ MISSING | Notification Service needs to send the payment confirmation email but `customerEmail` is not in the PaymentConfirmed payload. notification-spec expects it. |
| `bookingId` | ✅ | |
| `amountPaid` | ✅ | |

> ❌ **Gap**: `customerEmail` needed by Notification Service is absent from PaymentConfirmed. Payment Service doesn't own customer data. Options: include `customerEmail` in `BookingCreated` → Notification caches it; or Notification Service fetches customer email from Identity Service via REST on demand.

**Verdict**: ❌ **Critical** — PaymentConfirmed payload is missing `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold` (needed by Analytics) and `customerEmail` (needed by Notification).

---

### 1.6 `PaymentFailed` — `cinema.payment.payment-failed`

**Publisher**: Payment Service (payment-spec §8.1)
**Consumers**: Booking Service, Notification Service

| Field | Booking Needs | Notification Needs | Match? |
|-------|--------------|-------------------|--------|
| `bookingId` | ✅ (release seat locks) | ✅ | |
| `invoiceId` | ✅ | ✅ | |
| `paymentId` | — | — | ✅ (extra) |
| `responseCode` / `reason` | — | ✅ (user-facing message) | ✅ |
| `customerEmail` | — | ❌ NOT in payload | Same gap as PaymentConfirmed |

**Verdict**: ⚠️ `customerEmail` missing from `PaymentFailed` for Notification Service.

---

### 1.7 `TicketIssued` — `cinema.booking.ticket-issued`

**Publisher**: Booking Service (kafka-event-schema.md §3)
**Consumer**: Notification Service

| Field | Notification Needs | Match? | Issue |
|-------|-------------------|--------|-------|
| `bookingId` | ✅ | ✅ | |
| `customerEmail` | ✅ | ✅ | |
| `accountId` | needed for Identity lookup | ✅ | |
| `movieTitle`, `cinemaName`, `showTime` | ✅ (email content) | ✅ | |
| `tickets[].ticketCode` | ✅ (QR content) | ✅ | |
| `tickets[].seatName`, `seatType`, `price` | ✅ (email body) | ✅ | |

**Verdict**: ✅ Consistent.

---

### 1.8 `LoyaltyPointsEarned` — `cinema.booking.loyalty-points-earned`

**Publisher**: Booking Service (kafka-event-schema.md §3)
**Consumer**: Identity Service

| Field | Identity Needs | Match? | Issue |
|-------|---------------|--------|-------|
| `customerId` | ✅ (add to `customer.loyaltyPoints`) | ✅ | |
| `netPoints` | ✅ | ✅ | |
| `bookingId` | ✅ (idempotency key) | ✅ | |
| `isRefund` | ✅ (sign of netPoints) | ✅ | |

**Verdict**: ✅ Consistent.

---

### 1.9 `InvoiceRefunded` — `cinema.payment.invoice-refunded`

**Publisher**: Payment Service (payment-spec §8.1)
**Consumers**: Analytics Service (analytics-spec §3.2), Notification Service

| Field | Analytics Needs | Notification Needs | Match? | Issue |
|-------|----------------|-------------------|--------|-------|
| `bookingId` | ✅ | ✅ | ✅ | |
| `invoiceId` | ✅ | ✅ | ✅ | |
| `refundAmount` | ✅ | ✅ | ✅ | |
| `refundedAt` | ✅ | ✅ | ✅ | |
| `customerEmail` | — | ❌ NOT in payload | ⚠️ | Notification Service needs email but it's absent |
| `originalPaymentDate` | ✅ NEEDED by analytics | ❌ NOT in payload | ❌ | analytics-spec §3.2 says: "resolved by re-querying the original SUCCESS payment's `paymentDate`" — in microservice this cross-service query is not feasible; `originalPaymentDate` must be in the event. |

**Verdict**: ❌ **Two gaps**: `originalPaymentDate` missing (Analytics cannot subtract from correct date bucket); `customerEmail` missing (Notification Service).

---

### Kafka Consistency Summary

| Event | Status | Critical Issues |
|-------|--------|----------------|
| `ScreeningCreated` | ⚠️ | Field name conflict: `priceSnapshot` vs `price` |
| `ScreeningCancelled` | ✅ | None |
| `BookingCreated` | ✅ | Minor: `expiredAt` unused |
| `BookingCancelled` | ✅ | None |
| `PaymentConfirmed` | ❌ | Missing: `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold`, `customerEmail` |
| `PaymentFailed` | ⚠️ | Missing: `customerEmail` |
| `TicketIssued` | ✅ | None |
| `LoyaltyPointsEarned` | ✅ | None |
| `InvoiceRefunded` | ❌ | Missing: `originalPaymentDate`, `customerEmail` |

---

## 2. API Contract Consistency (Inter-Service Sync Calls)

Verifying that every synchronous call is documented on **both sides** (caller documents the call; provider documents the endpoint).

| Caller | Endpoint Called | Provider Documents It? | Match? | Issue |
|--------|----------------|----------------------|--------|-------|
| Booking Service | `GET /screenings/{id}` (Catalog) | catalog-spec §6.9: `GET /screenings/{screeningId}` | ✅ | |
| Booking Service | `GET /seats/room/{roomId}` (Catalog) | catalog-spec §6.7: `GET /seats/room/{roomId}` | ✅ | |
| Payment Service | `GET /bookings/{id}/summary` (Booking) | booking-spec §6: listed | ✅ | |
| Analytics Service | `GET /cinemas` (Catalog) | catalog-spec §6.4: `GET /cinemas` | ✅ | |
| Identity Service | `PUT /customers/{id}/loyalty-points` (Identity) | auth-contracts.md: `GET /customers/{id}/loyalty-points` listed, but PUT/add not documented | ⚠️ | loyalty-points endpoint is mentioned in service-boundaries.md as `GET /customers/{id}/loyalty-points` but the Booking Service needs a **write** endpoint. No `PUT` or `POST /customers/{id}/loyalty-points` endpoint is documented in auth-contracts.md. |
| API Gateway → Identity | `POST /auth/introspect` | auth-contracts §2 and §4 | ✅ | |
| All services | Identity Service via Gateway JWT validation | auth-contracts §6 (Gateway Auth Filter) | ✅ | Forwarded headers: `X-User-Id`, `X-User-Roles`, `X-Cinema-Id` — all documented in auth-contracts |
| Booking Service → Identity | `POST /customers/{id}/loyalty-points` (add points) | ❌ Not documented in auth-contracts or identity-spec | ❌ | auth-contracts.md lists only `GET /customers/{id}/loyalty-points`. The write path (used by `BookingServiceImpl.addLoyaltyPoints()` and the planned `LoyaltyPointsEarned` Kafka consumer in Identity) is **not documented anywhere** in the specs. |

**Verdict**: ⚠️ The loyalty-points **write endpoint** on Identity Service is undocumented across all specs. It must be added to `auth-contracts.md` or `identity-service-spec.md`.

---

## 3. Enum Consistency

Checking whether enum values used in inter-service communication (event payloads, API params) are consistent with the canonical definitions in `enums-and-types.md`.

| Enum | Defined In (enums-and-types.md) | Used In | Values | Consistent? | Issue |
|------|--------------------------------|---------|--------|-------------|-------|
| `DayType` | `WEEKDAY`, `WEEKEND` | catalog-spec, kafka-event-schema, service-boundaries.md | service-boundaries.md mentions `HOLIDAY` in the PriceConfig description | ❌ | `HOLIDAY` is referenced in service-boundaries.md §Chi tiết Catalog Service ("DayType × TimeSlot × SeatType") but does NOT exist in `DayType.java`. Only `WEEKDAY` and `WEEKEND` exist. The catalog-spec §4.2 correctly flags this. Must remove `HOLIDAY` references from service-boundaries.md or implement it. |
| `TimeSlot` | `MORNING`, `AFTERNOON`, `EVENING`, `LATE_NIGHT` | catalog-spec, kafka-event-schema, service-boundaries.md | service-boundaries.md mentions `NIGHT`; kafka-event-schema §3 ScreeningCreated uses `LATE_NIGHT` correctly | ❌ | service-boundaries.md §Chi tiết Catalog Service lists `MORNING/AFTERNOON/EVENING/NIGHT`. The actual code enum is `LATE_NIGHT` (not `NIGHT`). enums-and-types.md correctly documents `LATE_NIGHT`. service-boundaries.md has a **stale value**. |
| `ScreeningSeatStatus` | `AVAILABLE`, `LOCKED`, `SOLD` | Booking Service SeatReservation | booking-spec renames `SOLD` → `BOOKED` as `SeatReservationStatus` | ⚠️ | This is a deliberate rename (explained in booking-spec §2.2). New enum `SeatReservationStatus` (AVAILABLE/LOCKED/BOOKED) is for the microservice's new entity. The monolith's `ScreeningSeatStatus` (AVAILABLE/LOCKED/SOLD) remains unchanged. The two are not in conflict — they're in different domains. Notation: enums-and-types.md documents `SOLD` but the microservice design uses `BOOKED`. Both are correct for their respective contexts. Ensure new service uses `BOOKED` consistently. |
| `BookingStatus` | `PENDING`, `CONFIRM`, `PAID`, `EXPIRED`, `CANCELLED`, `REFUNDED` | booking-spec, payment-spec, kafka events | booking-spec uses `PENDING`, `PAID`, `EXPIRED`, `CANCELLED`, `REFUNDED` consistently | ✅ | `CONFIRM` exists in code but its usage is ambiguous; not referenced in most flow diagrams. |
| `MovieStatus` | `coming_soon`, `now_showing`, `archived` (snake_case) | catalog-spec | catalog-spec correctly documents snake_case values | ✅ | enums-and-types.md notes the unusual lowercase. |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED` | payment-spec | ✅ | ✅ | `CANCELLED` and `REFUNDED` are defined but payment-spec notes they are currently unused code paths. |
| `InvoiceStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` | payment-spec | ✅ | ✅ | |
| `TicketStatus` | `ACTIVE`, `USED`, `CANCELLED`, `EXPIRED`, `FOR_TRANSFER` | booking-spec | booking-spec uses `FOR_TRANSFER`; kafka-event-schema.md §3 uses `TRANSFER_PENDING` | ❌ | **Conflict**: enums-and-types.md documents `FOR_TRANSFER` (the actual code value). kafka-event-schema.md Appendix table says "was `TRANSFER_PENDING` in spec doc". This parenthetical suggests an old draft value leaked in. Must standardize to `FOR_TRANSFER`. |
| `RoomType` | `STANDARD`, `IMAX`, `FOUR_DX`, `GOLD_CLASS` | catalog-spec | catalog-spec §2.3 Room entity says `STANDARD`, `IMAX`, `4DX`, `DOLBY` | ❌ | **Conflict**: enums-and-types.md says `FOUR_DX` and `GOLD_CLASS`. catalog-service-spec.md §2.3 says `4DX` and `DOLBY`. These are different values. One of the specs read the wrong code or the enum was recently changed. **Must re-read `RoomType.java` to confirm actual values.** |
| `ScreeningStatus` | `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELED` | catalog-spec | catalog-spec §12 also uses `CANCELED` (single-L) | ✅ | Note: single-L spelling. Ensure API consumers use `CANCELED` not `CANCELLED`. |
| `NotificationStatus` | `PENDING`, `SENT`, `READ`, `FAILED` | notification-spec | notification-spec does not list a separate `READ` status explicitly | ✅ | |
| `ReportType` | `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`, `CUSTOM` | analytics-spec | analytics-spec §10 matches | ✅ | |
| `ErrorCode` (code 2036) | `AGERATING_CODE_EXISTED` AND `MOVIE_HAS_SCHEDULED_SCREENINGS` | api-contracts.md | ❌ Duplicate code | ❌ | Two different error codes share code `2036`. catalog-service-spec.md §11 lists different error code numbers (3001-4011) that don't match api-contracts.md §3. **Catalog-spec error codes are inconsistent with the api-contracts ErrorCode catalog.** Must reconcile. |

---

### Enum Conflict Summary

| Conflict | Severity | Fixed? |
|----------|----------|---------|
| `DayType.HOLIDAY` referenced in service-boundaries.md but doesn't exist | High | ✅ FIXED — removed from table; warning note added (2026-06-21) |
| `TimeSlot.NIGHT` in service-boundaries.md → should be `LATE_NIGHT` | High | ✅ FIXED — updated to `LATE_NIGHT` (2026-06-21) |
| `TicketStatus.TRANSFER_PENDING` in kafka-event-schema.md → should be `FOR_TRANSFER` | Medium | ✅ FIXED — parenthetical removed from enums-and-types.md (2026-06-21) |
| `RoomType` values: catalog-spec had `4DX`/`DOLBY`, correct values are `FOUR_DX`/`GOLD_CLASS` | High | ✅ FIXED — catalog-service-spec.md corrected; enums-and-types.md verified (2026-06-21) |
| ErrorCode catalog in api-contracts.md vs error codes in catalog-service-spec.md §11 | Medium | Reconcile numbering; decide per-service error code ranges |

---

## 4. Missing Items Checklist

All items marked `[NOT IN MONO — TO DESIGN]`, `[TO BE IMPLEMENTED]`, `⚠️`, or noted as bugs/gaps across all specs.

| Spec File | Section | Item | Action Needed |
|-----------|---------|------|---------------|
| kafka-event-schema.md | All events | ALL 8 Kafka events are `[TO BE IMPLEMENTED]` — Kafka doesn't exist in mono | Implement Kafka infrastructure (docker-compose.yml done ✅) and all event producers/consumers |
| kafka-event-schema.md | §4 Error Handling | Retry + DLQ pattern (`@RetryableTopic`) not implemented | Add `@RetryableTopic` to all `@KafkaListener` methods |
| kafka-event-schema.md | §4 Idempotency | Per-consumer idempotency table pattern described but not in any spec | Each consuming service needs an `processed_events(eventId)` table or equivalent |
| catalog-service-spec.md | §5 Redis Caching | Redis cache `[NOT YET IMPLEMENTED]` in mono | Implement `@Cacheable` + Redis for movie/screening/cinema data |
| catalog-service-spec.md | §4.2 | `DayType.HOLIDAY` not implemented | Decide: implement public holiday calendar or remove HOLIDAY from design |
| catalog-service-spec.md | §13 #1 | `LocalDateTime` → UTC `Instant` conversion before publishing events | All screening times must be converted to UTC in the `ScreeningCreated` event |
| catalog-service-spec.md | §13 #4 | `Cinema.manager` FK to Identity domain | Replace `@OneToOne Staff` with `String managerId` + REST call |
| booking-service-spec.md | §2.2 | `SeatReservation` entity is `[NEW — not in mono]` | Design and implement entire `seat_reservation` table |
| booking-service-spec.md | §2.2 Ticket | `Ticket.screeningSeat` → `seatReservationId` rename | Update Ticket entity FK in microservice |
| booking-service-spec.md | §2.2 Booking | `Booking.screening` → denormalized fields | Replace FK with `screeningId`, `movieTitle`, `cinemaId`, etc. |
| payment-service-spec.md | §6.3 | `PaymentType.REFUND` is dead code — no `Payment` record created on refund | Implement `REFUND` payment record creation in refund flow |
| payment-service-spec.md | §14 #2 | IPN and Return handler both call `confirmBookingPayment()` — double-processing risk | In microservice, Return handler must be read-only; only IPN publishes `PaymentConfirmed` |
| payment-service-spec.md | §14 #3 | Revenue aggregation belongs in Analytics, not Payment | Remove `revenueAggregationService` calls from Payment; handle via `PaymentConfirmed` event |
| analytics-service-spec.md | §3.2 | `processInvoiceRefundForRevenue` has no idempotency check | Add idempotency guard (keyed on `invoiceId + "REFUND"`) |
| analytics-service-spec.md | §3.3 | `POST /revenue/reprocess` auth is **commented out** | Re-enable `@PreAuthorize` before production |
| analytics-service-spec.md | §4 | N×M midnight initialization: 100 movies × 10 cinemas = 1000 rows/night | Switch to lazy row creation in microservice |
| analytics-service-spec.md | §5 | `generateForAllCinemas` calls `cinemaService.getCinemas()` — cross-domain sync call | Replace with local `cinemas` read-replica from Kafka events |
| analytics-service-spec.md | §8 | `RevenueController` returns `ResponseEntity<T>` directly (no `ApiResponse<T>` wrapper) | Standardize to `ApiResponse<T>` wrapper in microservice |
| notification-service-spec.md | All events | `InvoiceRefunded` notification sent via `InvoiceRefundedEvent` (Spring app event) — needs Kafka adaptation | Replace with `cinema.payment.invoice-refunded` Kafka consumer |
| notification-service-spec.md | — | `POST /notifications/email/send` is listed in auth-contracts.md as public | This is an internal-only endpoint and must be secured behind gateway or removed from public exposure |
| auth-contracts.md | §2 Flow D | **Bug**: `refreshToken()` calls `findByUsername(sub)` but `sub` contains UUID account ID | Fix: call `findById(sub)` not `findByUsername(sub)` |
| auth-contracts.md | §3 | `hasRole('MANAGER')` used in `ShiftType` / `WorkSchedule` — these modules are excluded from microservice scope | Remove or reassign `MANAGER` role guards when those modules are dropped |
| auth-contracts.md | §5 | `POST /movies/**`, `POST /cinemas/**`, `POST /screenings/**` are accidentally public (security gap) | Add `@PreAuthorize("hasRole('ADMIN')")` to create endpoints |
| api-contracts.md | §3 | ErrorCode `2036` is duplicated (`AGERATING_CODE_EXISTED` and `MOVIE_HAS_SCHEDULED_SCREENINGS`) | Assign unique codes; define per-service numeric ranges |
| api-contracts.md | §3 | Codes `5001`–`5009` shared across Review, File, Chatbot (all excluded modules) | Clean up; these codes will be unused in microservice |
| api-contracts.md | §5 | Catch-all `Exception` handler returns HTTP 400 instead of 500 | Fix `GlobalExceptionHandler` to use `ResponseEntity.internalServerError()` for catch-all |
| infrastructure-spec.md | §10 | Socket.IO port `9092` conflicts with Kafka | ✅ Already addressed: reassigned to `9100` in infra-spec |
| application.yml | — | `jwt.signerKey` hardcoded in plain text | Move to `${JWT_SECRET}` env var immediately |
| application.yml | — | `spring.datasource.password: 3kSE347@123` hardcoded | Move to `${DB_PASSWORD}` env var |

---

## 5. Spec Completeness Score

Rating each service spec on 5 dimensions (✅ = complete, ⚠️ = partial/design-only, ❌ = missing).

| Service | Domain Model | DB Schema | APIs | Business Rules | Kafka | Score |
|---------|-------------|-----------|------|----------------|-------|-------|
| **Identity** | ✅ (auth-contracts.md is thorough) | ⚠️ (tables listed in service-boundaries.md but no column-level spec file) | ✅ | ✅ (JWT flows, RBAC, OTP) | ⚠️ (`LoyaltyPointsEarned` consumer design documented; no producer) | **4/5** |
| **Catalog** | ✅ | ✅ (all columns, constraints, relations) | ✅ | ✅ (price snapshot algorithm fully documented) | ✅ (ScreeningCreated, ScreeningCancelled fully designed) | **5/5** |
| **Booking** | ✅ | ✅ (`SeatReservation` NEW entity fully defined) | ✅ | ✅ (seat lock TTL, orphan seat, loyalty points) | ⚠️ (events listed but consumer logic for `PaymentConfirmed` → ticket creation is partially described) | **4.5/5** |
| **Payment** | ✅ | ✅ | ✅ | ✅ (VNPay algorithm step-by-step, HMAC-SHA512, IPN idempotency) | ⚠️ (PaymentConfirmed payload missing critical analytics/notification fields) | **4/5** |
| **Notification** | ✅ | ⚠️ (entity shapes described but no column-level table spec) | ✅ | ✅ (event → channel → template mapping) | ⚠️ (depends on customerEmail being in all payment events — see §1 gaps) | **3.5/5** |
| **Analytics** | ✅ | ✅ (all 4 tables with columns, constraints, bugs documented) | ✅ | ✅ (aggregation algorithm step-by-step, idempotency) | ⚠️ (PaymentConfirmed consumer cannot work without missing event fields — see §1.5) | **3.5/5** |

### Overall Assessment

| Category | Status |
|----------|--------|
| Domain models | ✅ Complete across all services |
| Business logic algorithms | ✅ Well-documented (price snapshot, VNPay, revenue aggregation) |
| Kafka event schemas | ⚠️ 3 of 9 events have missing fields; 1 field name conflict |
| Inter-service sync API | ⚠️ Loyalty-points write endpoint undocumented |
| Enum consistency | ❌ 4 conflicts found (DayType, TimeSlot, TicketStatus, RoomType) |
| Security | ❌ 3 security gaps (hardcoded secrets, public create endpoints, reprocess unprotected) |

---

## 6. Open Questions

Items that are ambiguous, conflicting, or require a design decision before implementation begins.

| # | Question | Found In | Options |
|---|----------|---------|---------|
| 1 | **`DayType.HOLIDAY`**: service-boundaries.md mentions it as a pricing dimension but it doesn't exist in code. Should it be implemented? | service-boundaries.md, enums-and-types.md, catalog-spec §4.2 | Option A: Implement HOLIDAY using a public holiday calendar API or manual DB table. Option B: Remove HOLIDAY from the spec entirely — accept that all non-weekend days are priced as WEEKDAY. |
| 2 | **`PaymentConfirmed` enrichment**: The event is missing `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold`. Who provides this data? | §1.5, analytics-spec §7.1 | Option A: Booking Service publishes these fields in `BookingCreated`; Analytics Service joins by `bookingId` (requires local state). Option B: Payment Service enriches the event by querying Booking Service via REST. Option C: Add a `BookingPaid` event from Booking Service alongside `TicketIssued` that contains the full breakdown. |
| 3 | **`customerEmail` propagation**: Multiple events (PaymentConfirmed, PaymentFailed, InvoiceRefunded) need `customerEmail` for Notification Service but it's not in those events. | §1.5, §1.6, §1.9 | Option A: Include `customerEmail` in all payment-domain events (Payment Service must store it). Option B: Notification Service fetches email from Identity Service via REST using `customerId` from the event. Option C: Notification Service caches `customerId → email` by consuming `CustomerCreated` events from Identity. |
| 4 | **`originalPaymentDate` for refund revenue**: Analytics needs the original payment date to subtract from the right date bucket on refund. | analytics-spec §3.2, §1.9 | The `InvoiceRefunded` event must include `originalPaymentDate` (the `paidAt` from the original SUCCESS payment). Payment Service owns this data and can include it when publishing the event. |
| 5 | **`RoomType` enum values**: enums-and-types.md lists `FOUR_DX`, `GOLD_CLASS`; catalog-spec lists `4DX`, `DOLBY`. Which is correct? | §3 enum table | Re-read `RoomType.java` directly to resolve. |
| 6 | **Loyalty points write endpoint**: `PUT /customers/{id}/loyalty-points` (or equivalent) is needed by both the monolith's sync call (`BookingServiceImpl.addLoyaltyPoints()`) and the planned `LoyaltyPointsEarned` Kafka consumer. It is not documented in any spec. | §2 API Contract table, auth-contracts.md | Document and implement the endpoint in Identity Service. Define whether it's an absolute set or a delta add/subtract. |
| 7 | **`TicketStatus.FOR_TRANSFER` vs `TRANSFER_PENDING`**: kafka-event-schema.md mentions `TRANSFER_PENDING` as a historical name. | §3 enum table | Clean up all references to use `FOR_TRANSFER`. |
| 8 | **Return handler vs IPN — duplicate confirmBookingPayment**: Both the VNPay Return and IPN handlers call `bookingService.confirmBookingPayment()` in the monolith, risking double execution. | payment-spec §14 #2 | In microservice: only IPN publishes `PaymentConfirmed`. Return handler is strictly read-only. Document this clearly in payment-spec. |
| 9 | **`BookingStatus.CONFIRM`**: This value exists in the code but no flow diagram shows when a booking transitions to `CONFIRM` vs going directly `PENDING → PAID`. | enums-and-types.md §1 | Clarify or remove. If it's an intermediate state after invoice creation, document the transition trigger. |
| 10 | **Identity Service spec file**: There is no `specs/identity-service-spec.md` file — auth-contracts.md partially covers it but there's no column-level entity schema for `accounts`, `customers`, `staffs`, `roles`, `permissions`, `invalidated_tokens`, `otp_tokens`. | §5 completeness score | Create `specs/identity-service-spec.md` following the same pattern as other service specs. |
| 11 | **Notification Service entity spec**: notification-service-spec.md covers flows but doesn't have a column-level `notification_channels`, `notification_preferences`, `notification_templates` schema. | §5 completeness score | Expand notification-service-spec.md with full entity definitions. |
| 12 | **Redis password in docker-compose.yml**: The `redis` container uses `${REDIS_PASSWORD}` but the `redis-cli ping` healthcheck also passes `-a ${REDIS_PASSWORD}`. If `REDIS_PASSWORD` is empty (no auth mode), the healthcheck will fail. | infrastructure-spec.md, docker-compose.yml | Either require a non-empty REDIS_PASSWORD or use a conditional healthcheck. |
| 13 | **`ErrorCode` numeric ranges for microservices**: Currently, error codes like `2036` are duplicated and codes `2040-2052` cover excluded modules (ShiftType, WorkSchedule). When splitting into microservices, each service should own a non-overlapping range. | api-contracts.md §3 | Define a per-service error code range (e.g., Identity: 1000-1999, Catalog: 2000-2999, Booking: 3000-3999, Payment: 4000-4999, Notification: 5000-5999, Analytics: 6000-6999). |
| 14 | **Analytics Service consuming cinema list**: `RevenueReportService.generateForAllCinemas()` calls `cinemaService.getCinemas()`. In microservice, this becomes a REST call to Catalog or a local read replica. | analytics-spec §5, §8 | Decide: REST (synchronous, simpler) or event-driven local table (resilient to Catalog downtime). |

---

## Appendix: Quick Fix List (prioritized)

### Must fix before any implementation begins

1. ❌ Enrich `PaymentConfirmed` event with: `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold`, `customerEmail`
2. ❌ Add `originalPaymentDate` to `InvoiceRefunded` event
3. ❌ Add `customerEmail` to `PaymentFailed` event
4. ❌ Standardize `ScreeningCreated.seats[].price` vs `priceSnapshot` field name → use `price`
5. ❌ Re-read `RoomType.java` and correct the wrong spec (enums-and-types.md vs catalog-spec)
6. ❌ Fix `refreshToken()` bug: `findByUsername(sub)` → `findById(sub)`
7. ❌ Document `PUT /customers/{id}/loyalty-points` (or delta endpoint) in identity spec

### Fix before production

8. ⚠️ Move hardcoded `jwt.signerKey` and `datasource.password` to env vars
9. ⚠️ Secure `POST /movies`, `POST /cinemas`, `POST /screenings` endpoints
10. ⚠️ Secure `POST /revenue/reprocess` (re-enable `@PreAuthorize`)
11. ⚠️ Fix `Exception` catch-all handler: return HTTP 500, not 400
12. ✅ FIXED: `NIGHT` → `LATE_NIGHT` in service-boundaries.md, removed `HOLIDAY` with warning note
13. ✅ FIXED: `FOR_TRANSFER` parenthetical cleaned up in enums-and-types.md
14. ⚠️ Resolve `BookingStatus.CONFIRM` state — document or remove

### Before Kafka implementation

15. ⚠️ Define per-service ErrorCode numeric ranges
16. ⚠️ Choose `customerEmail` propagation strategy (§6 Q3)
17. ⚠️ Choose `PaymentConfirmed` enrichment strategy (§6 Q2)
18. ⚠️ Decide on `DayType.HOLIDAY` implementation (§6 Q1)

---

*Updated: 2026-06-21 | Cross-read of all 11 spec files. Every issue is traced to its source spec line.*
