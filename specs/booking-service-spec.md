# Booking Service — Specification

> **Source**: Direct code read on 2026-06-21.
> **Port**: 8083
> **Database**: PostgreSQL (per-service schema) + Redis
> **Message Broker**: Kafka (consume `ScreeningCreated`, `ScreeningCancelled`, `PaymentConfirmed`, `PaymentFailed`; publish `BookingCreated`, `BookingCancelled`, `TicketIssued`, `LoyaltyPointsEarned`)

---

## 1. Service Overview

The Booking Service is the central transactional hub of the cinema system. It manages:
- **SeatReservation**: Persistent status (`AVAILABLE`/`LOCKED`/`BOOKED`) + ephemeral Redis lock (10-min TTL)
- **Booking**: Full lifecycle from `PENDING` → `PAID`/`CANCELLED`/`REFUNDED`
- **BookingCombo**: F&B items attached to a booking (denormalized price snapshot from Catalog Service)
- **Ticket**: One ticket per seat per booking; issued after payment confirmed

> **Combo and ComboItem catalog** are owned by **Catalog Service** (see `catalog-service-spec.md §6.10–6.11`). Booking Service calls `GET /combos/{comboId}` on Catalog Service via REST to validate availability and snapshot the price into `BookingCombo`.

**Key design principle**: Booking Service holds **no live FK references** to Catalog Service tables. All catalog data (movieTitle, roomName, screeningId, seatId, seatName, seatTypeName, price) is **snapshotted** either from the `ScreeningCreated` Kafka event or at booking creation time.

---

## 2. Domain Model

### 2.1 Entity Graph

```
ScreeningCreated (Kafka)
        │
        ▼
SeatReservation [N per screening]
        │ (1 per BOOKED seat)
        ▼
Booking ──── Customer ──── (Identity Service cross-domain ref)
   │
   ├──── BookingCombo [N] ──── comboId (cross-domain ref → Catalog Service)
   │
   └──── Ticket [1 per seat] ──── SeatReservation
```

---

### 2.2 Entity Definitions

---

#### SeatReservation (NEW — replaces `ScreeningSeat`)

**Target table**: `seat_reservations`

This entity does **not exist** in the monolith. It is created by consuming `ScreeningCreated` Kafka events and fully replaces the monolith's `ScreeningSeat` entity.

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `UUID` | `id` | PK, `@GeneratedValue(UUID)` | |
| `screeningId` | `String` | `screening_id` | NOT NULL, `@Index` | Snapshot from `ScreeningCreated` event; no FK to Catalog DB |
| `seatId` | `String` | `seat_id` | NOT NULL | Snapshot from `ScreeningCreated` event |
| `seatName` | `String` | `seat_name` | NOT NULL | e.g. `"A5"` — denormalized; from event payload |
| `seatTypeId` | `String` | `seat_type_id` | NOT NULL | Snapshot from event |
| `seatTypeName` | `String` | `seat_type_name` | NOT NULL | e.g. `"VIP"` — denormalized |
| `price` | `BigDecimal` | `price` | NOT NULL, `precision=10, scale=2` | **Immutable snapshot** from screening creation; never recalculated |
| `status` | `SeatReservationStatus` | `status` | NOT NULL | `AVAILABLE` / `LOCKED` / `BOOKED` |
| `bookingId` | `UUID` | `booking_id` | nullable, no FK constraint (event-sourced) | Set when seat is locked; `null` if AVAILABLE |
| `lockExpiresAt` | `Instant` | `lock_expires_at` | nullable | Set when `LOCKED`; `null` when `AVAILABLE` or `BOOKED` |
| `createdAt` | `Instant` | `created_at` | NOT NULL | When the record was created (screening creation time) |

**Unique constraint**: `UNIQUE (screening_id, seat_id)` — only one reservation per seat per screening.

**Index**: `INDEX idx_seat_res_screening (screening_id)` — all seat availability queries filter by `screeningId`.

> **Mapping from mono**: `ScreeningSeat` → `SeatReservation`. The monolith's `ScreeningSeat.booking` (String, nullable) → `bookingId (UUID, nullable)`. `ScreeningSeat.status` `AVAILABLE/LOCKED/SOLD` → `SeatReservationStatus` `AVAILABLE/LOCKED/BOOKED` (renamed `SOLD` → `BOOKED` for clarity).

---

#### Booking (Monolith → Microservice)

**Package**: `booking.entity.Booking`
**Table**: `bookings`

> **Note**: Unlike most catalog entities, `Booking` does **not** extend `BaseEntity`. It has its own `id` (UUID), `createdAt`, `expiredAt` fields.

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `UUID` | `id` | PK, `@GeneratedValue(UUID)` | |
| `customer` | `Customer` | `customer_id` | nullable FK → `customers.id` | Null for guest bookings (walk-in at counter) |
| `screening` | `Screening` | `screening_id` | NOT NULL FK | **Cross-domain reference** — must be replaced with `screeningId: String` in microservice |
| `status` | `BookingStatus` | `status` | NOT NULL | See state machine below |
| `subtotal` | `BigDecimal` | `subtotal` | | Seat prices + combo prices before discount |
| `discount` | `BigDecimal` | `discount` | | Loyalty points redeemed, converted to VND |
| `totalAmount` | `BigDecimal` | `total_amount` | | `subtotal - discount` |
| `createdAt` | `Instant` | `created_at` | | Booking creation time |
| `expiredAt` | `Instant` | `expired_at` | | `createdAt + 10 minutes` — seat hold expiry |

**Derived field (display only)**:
```java
bookingCode = "BK-" + id.toString().substring(0, 8).toUpperCase()
// Example: "BK-3FA85F64"
```

**In microservice**: Replace `Screening screening` (@ManyToOne cross-domain) with:
```java
String screeningId;
String movieTitle;    // denormalized
String roomName;      // denormalized
String cinemaId;      // denormalized
String cinemaName;    // denormalized
LocalDateTime startTime; // denormalized (for display)
```

---

#### ScreeningSeat (Monolith transitional — becomes SeatReservation)

**Package**: `screeningSeat.entity.ScreeningSeat`
**Table**: `screeningSeats`

| Field | Mono Type | New Equivalent in `seat_reservations` | Notes |
|-------|-----------|--------------------------------------|-------|
| `id` | `String` | `id` (UUID) | |
| `screening` | `@ManyToOne Screening` | `screeningId: String` | Denormalized string, no FK |
| `seat` | `@ManyToOne Seat` | `seatId: String` | Denormalized, no FK |
| `booking` | `String` | `bookingId: UUID` | Was raw String; now typed UUID |
| `status` | `ScreeningSeatStatus` (AVAILABLE/LOCKED/SOLD) | `SeatReservationStatus` (AVAILABLE/LOCKED/BOOKED) | `SOLD` renamed to `BOOKED` |
| `lockUntil` | `Instant` | `lockExpiresAt: Instant` | Renamed |
| *(not present)* | — | `seatName`, `seatTypeId`, `seatTypeName`, `price` | NEW — from `ScreeningCreated` event |

---

#### BookingCombo

**Package**: `bookingCombo.entity.BookingCombo`
**Table**: `booking_combos`

> **Denormalized snapshot entity.** Booking Service does **not** own the `Combo` or `ComboItem` entities — those belong to Catalog Service. `BookingCombo` captures a price+name snapshot at the moment a customer adds a combo to their booking, so future price/name changes on the combo do not affect existing bookings.

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK, `@GeneratedValue(UUID)` | |
| `bookingId` | `String` | `booking_id` | NOT NULL | FK → `bookings.id` |
| `comboId` | `String` | `combo_id` | NOT NULL | Cross-domain ref → Catalog Service `combos.id` (no FK constraint) |
| `comboName` | `String` | `combo_name` | NOT NULL | **Snapshot** of `combo.name` at order time |
| `quantity` | `Integer` | `quantity` | | How many units ordered |
| `remain` | `Integer` | `remain` | | Remaining units (decremented at check-in) |
| `unitPrice` | `BigDecimal` | `unit_price` | NOT NULL | **Snapshot** of `combo.price` at order time |
| `subtotal` | `BigDecimal` | `subtotal` | NOT NULL | `unitPrice × quantity` |

> **Design note**: `comboName` and `unitPrice` are snapshots. If the combo price or name changes later, the existing booking is unaffected. `remain` tracks partial combo redemption during check-in.

---

#### Ticket

**Package**: `ticket.entity.Ticket`
**Table**: `tickets`

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `UUID` | `id` | PK, `@GeneratedValue(UUID)` | |
| `booking` | `Booking` | `booking_id` | NOT NULL, FK, `@Index idx_ticket_booking` | |
| `screeningSeat` | `ScreeningSeat` | `screening_seat_id` | NOT NULL, FK, UNIQUE | In microservice: replace with `seatReservationId: UUID` |
| `seatName` | `String` | `seat_name` | VARCHAR(10) | Denormalized: `rowChair + seatNumber` |
| `price` | `BigDecimal` | `price` | NOT NULL, `precision=10, scale=2` | Copied from `ScreeningSeat` price at ticket creation |
| `ticketCode` | `String` | `ticket_code` | NOT NULL, UNIQUE, VARCHAR(50), `@Index` | `"TK-" + UUID(8 chars uppercase)` |
| `qrContent` | `String` | `qr_content` | NOT NULL, TEXT | JSON string (see format below) |
| `status` | `TicketStatus` | `status` | NOT NULL, `@Index idx_ticket_status` | Default: `ACTIVE` |
| `usedAt` | `Instant` | `used_at` | nullable | Set on check-in |
| `expiresAt` | `Instant` | `expires_at` | NOT NULL | = `screening.endTime` (Asia/Ho_Chi_Minh zone) |
| `createdAt` | `Instant` | `created_at` | NOT NULL, `@CreationTimestamp` | |

---

## 3. SeatReservation Design

### 3.1 Status Transition Diagram

```
[Kafka: ScreeningCreated]
         │
         ▼
     AVAILABLE  ◄────────────────────────────────────────────┐
         │                                                    │
   PUT /seat-reservations/{id}/lock                          │
   (Redis SET seat:lock + status = LOCKED)                  │
         │                                                    │
         ▼                                                    │
      LOCKED ─────────────────────────────────── AVAILABLE   │
         │    TTL expires (10 min)               (Redis key  │
         │    OR PaymentFailed event             auto-evicts) │
         │    OR BookingCancelled event           │           │
         │                                       │           │
   PaymentConfirmed event                        └───────────┘
         │
         ▼
      BOOKED  (terminal — only reversed by refund/cancellation)
         │
   BookingCancelled after PAID
         │
         ▼
     AVAILABLE  (seats released back; `bookingId = null`, `lockExpiresAt = null`)
```

### 3.2 Redis Seat Lock

| Property | Value |
|----------|-------|
| **Key** | `seat:lock:{screeningId}:{seatId}` |
| **Value** | JSON: `{"customerId": "...", "lockedAt": "ISO-8601"}` |
| **TTL** | **10 minutes** |
| **Data type** | Redis `STRING` with EX |

**Set when**: `PUT /seat-reservations/{id}/lock` (customer selects a seat)
```redis
SET seat:lock:{screeningId}:{seatId} '{"customerId":"...","lockedAt":"..."}' EX 600
```

**Released when**:
- TTL expires (Redis auto-evicts; a scheduled job or Redis keyspace notification triggers `status = AVAILABLE`)
- `POST /bookings/{id}/cancel` (explicit unlock)
- `PaymentFailed` Kafka event received (release all seats in booking)

**Ownership check**: On `PUT /seat-reservations/{id}/lock`, verify the Redis key is not already set by a different customer. If set → `SEAT_ALREADY_LOCKED`.

> **⚠️ Current monolith implementation**: The monolith does **not use Redis** for seat locking. It uses an atomic SQL `UPDATE` to set `status = LOCKED` and `lockUntil = now + 10 min` via `screeningSeatRepository.lockSeats(ids, expiredAt)`. The Redis layer must be added in the microservice.

### 3.3 Seat Locking in Monolith (Actual Code)

The monolith's lock mechanism uses a custom `@Query`:

```java
// ScreeningSeatRepository
@Modifying
@Query("UPDATE ScreeningSeat s SET s.status = 'LOCKED', s.lockUntil = :expiredAt " +
       "WHERE s.id IN :ids AND s.status = 'AVAILABLE' AND " +
       "(s.lockUntil IS NULL OR s.lockUntil < CURRENT_TIMESTAMP)")
int lockSeats(@Param("ids") List<String> ids, @Param("expiredAt") Instant expiredAt);
```

The return value (updated row count) is compared to the requested count — if they differ, some seats were already locked → `SCREENING_SEATS_NOT_AVAILABLE`.

### 3.4 Orphan Seat Validation

`BookingServiceImpl.validateScreeningSeat()` enforces a cinema UX rule: **you cannot leave a single isolated available seat between occupied/selected seats in a row**.

The algorithm:
1. Groups seats by row
2. For each affected row, marks seats as: `2=selected`, `1=occupied`, `0=available`
3. Rejects bookings that would create an orphan pattern:
   - A `0` surrounded by two `2`s in adjacent positions
   - A `0` adjacent to a `1` with a `2` on the other side, while there's no "safe gap" (≥2 consecutive available seats) elsewhere in that row

---

## 4. Booking Lifecycle

### 4.1 BookingStatus State Machine

| Status | Meaning |
|--------|---------|
| `PENDING` | Booking created; seats are `LOCKED`; awaiting payment; expires in 10 min |
| ~~`CONFIRM`~~ | **[DEPRECATED — not used in microservice flow]** Defined in monolith enum but never set in any service method. Booking goes `PENDING → PAID` directly on `PaymentConfirmed`. Remove when creating the microservice `BookingStatus` enum. |
| `PAID` | Payment confirmed; seats are `BOOKED`; tickets issued |
| `EXPIRED` | Set by background scheduler when `expiredAt` passes and status is still `PENDING`; seats released |
| `CANCELLED` | Manually cancelled by customer (only from `PENDING`); seats released |
| `REFUNDED` | Cancelled after payment (from `PAID`); seats released; loyalty points reversed |

### 4.2 Transition Table

| From | To | Trigger | Code Location | Side Effects |
|------|----|---------|---------------|-------------|
| *(none)* | `PENDING` | `POST /bookings` | `BookingServiceImpl.createBooking()` | Seats `LOCKED`; `expiredAt = now + 10min` |
| `PENDING` | `PAID` | `PaymentConfirmed` Kafka event | `BookingServiceImpl.confirmBookingPayment()` | Seats → `BOOKED` (SOLD in mono); Tickets created; Loyalty points added |
| `PENDING` | `CANCELLED` | `POST /bookings/{id}/cancel` | `BookingServiceImpl.cancelBooking()` | Seats released → `AVAILABLE`; `bookingId = null` |
| `PENDING` | `EXPIRED` | Background scheduler (not yet implemented in mono) | Future | Seats released → `AVAILABLE` |
| `PAID` | `REFUNDED` | `BookingCancelled` Kafka event (or admin action) | `BookingServiceImpl.refundBooking()` | Seats released → `AVAILABLE`; Loyalty points reversed |

### 4.3 Booking Creation Flow (Detailed)

`POST /bookings` → `createBooking(CreateBookingRequest)`:

1. **Validate seat count**: `0 < seatCount ≤ 8` → `BOOKING_EXCEED_SEAT_LIMIT`
2. **Load screening**: must exist → `SCREENING_NOT_EXISTED`; movie must not be `archived` → `MOVIE_ALREADY_ENDED`
3. **Validate seat selection**: `validateScreeningSeat()` — checks orphan seat rule
4. **Atomic seat lock**: `screeningSeatRepository.lockSeats(ids, expiredAt)` — CAS-style UPDATE; if locked count ≠ requested count → `SCREENING_SEATS_NOT_AVAILABLE`
5. **Resolve customer**: `resolveCustomer(request)` (see below)
6. **Calculate seat subtotal**: `calculateSeatSubtotal(seats)` — re-queries `PriceConfig` (same algorithm as Catalog)
7. **Persist booking**: `status = PENDING`, `discount = 0`, `totalAmount = subtotal`, `expiredAt = now + 10min`
8. **Link seats to booking**: `seat.booking = bookingId.toString()` for each locked seat
9. **Return**: `CreateBookingResponse { id, expiredAt, subtotal, customerId }`

### 4.4 Customer Resolution (`resolveCustomer`)

| Scenario | Behaviour |
|----------|-----------|
| `customerId` provided | Look up existing Customer → `USER_NOT_EXISTED` if not found |
| No `customerId`, no name/email | Guest booking: `customer = null` |
| Email matches existing Account | Find or create `Customer` record linked to that account |
| New email (no account) | Create new `Account` (random 6-char alphanumeric password) + `Customer`; fire `CustomerCreatedEvent` (sends welcome email with temp password) |

Name parsing: If `customerName` is provided but `firstName`/`lastName` are not, splits on whitespace: last word = `firstName`, rest = `lastName`.

---

## 5. Ticket Design

### 5.1 Ticket Code Format

```
"TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
```

**Example**: `TK-3FA85F64`

- Length: **11 characters** (`TK-` + 8 hex chars)
- Unique: enforced by DB `UNIQUE` constraint on `ticket_code` + loop-retry in `generateUniqueCode()`
- **Not a UUID** — it is a 8-char hex substring of a UUID, prefixed with `TK-`

### 5.2 QR Content (stored in `qr_content` column)

```json
{"type": "TICKET", "ticketCode": "TK-3FA85F64"}
```

Generated by `QrGenerator.generateQrContent(ticketCode)` using Jackson `ObjectMapper`. This is a **text string** stored in the DB, not an image. The frontend renders it as a QR code image using a JS library.

The `service-boundaries.md` says "QR code removed", but the monolith still stores `qrContent`. The key point is: **no QR image is generated server-side**. The `qrContent` JSON string is the data payload; the frontend generates the actual QR image.

### 5.3 Ticket Creation (when triggered)

`TicketService.createTickets(bookingId)` is called inside `confirmBookingPayment()` (triggered by `PaymentConfirmed` event):

1. Verify `booking.status == PAID`
2. Load all `ScreeningSeat` records with `booking = bookingId`
3. Set `expiresAt = screening.endTime` (converted to UTC from `Asia/Ho_Chi_Minh`)
4. For each seat:
   - Generate unique `ticketCode` (retry until unique)
   - Generate `qrContent` JSON
   - Copy `price` from `ScreeningSeatService.getScreeningSeat(seat.id).price`
   - Set `status = ACTIVE`
5. Persist all tickets
6. Publish `TicketCreatedEvent` (Spring internal event → notification via Brevo email)

### 5.4 Check-in Validation

**Staff-facing endpoint**: `POST /tickets/check-in/{ticketCode}` (requires `ADMIN` or `STAFF` role)

```
1. Find ticket by ticketCode → TICKET_NOT_EXISTED
2. Check ticket.status == ACTIVE → TICKET_NOT_ACTIVE (if USED/CANCELLED/etc.)
3. Check now < ticket.expiresAt → TICKET_EXPIRED (expire and save if past)
4. Process combo consumption (from request body):
   - For each ComboUseItem { comboId, quantity }:
     - Find BookingCombo → BOOKING_COMBO_NOT_EXISTED
     - Check remain >= quantity → INSUFFICIENT_COMBO_QUANTITY
     - Decrement remain; save
5. Set ticket.status = USED; ticket.usedAt = now; save
```

**Customer QR self-check-in** (legacy): `checkInByQr(qrContent)` — parses JSON, extracts `ticketCode`, same validation but without combo processing.

### 5.5 Ticket Status Transitions

```
ACTIVE ─── checkInTicket() / checkInByQr() ──► USED
ACTIVE ─── now > expiresAt ─────────────────► EXPIRED (set lazily on next access or by scheduler)
ACTIVE ─── markTicketForTransfer() ─────────► FOR_TRANSFER (must be ≥1 hour before screening)
FOR_TRANSFER ─── cancelTicketTransfer() ────► ACTIVE
```

**Ticket Transfer Rules**:
- Can mark for transfer only if `status == ACTIVE` and `screening.startTime - now >= 1 hour`
- `FOR_TRANSFER` tickets are visible on the seat map to other customers who can "claim" them
- No actual transfer mechanism exists yet in code — the mono only marks the status

### 5.6 Ticket Expiry Scheduler

`TicketService.expireTickets()` — scheduled job that batch-sets all `ACTIVE` tickets with `expiresAt < now` to `EXPIRED`. Also `expireTicketsByBookingId(bookingId)` — called on booking refund.

---

## 6. Combo in Booking Service

> **Catalog data is owned by Catalog Service.** `Combo` and `ComboItem` entities are defined and managed in `catalog-service-spec.md §6.10–6.11`. This section documents only how Booking Service *uses* combos to create `BookingCombo` records.

### 6.1 Cross-Service Call Flow

When a customer selects combos for a booking, Booking Service calls Catalog Service via **synchronous REST**:

```
PUT /bookings/{bookingId}/combos
  └→ for each comboId: GET http://catalog-service/combos/{comboId}
       └→ validate combo exists and is not soft-deleted
       └→ snapshot { comboId, comboName, price } into BookingCombo
```

### 6.2 Booking Combo Flow

`PUT /bookings/{bookingId}/combos` — replaces all combo selections for a booking:

1. Verify `booking.status == PENDING` and `expiredAt > now`
2. Delete all existing `BookingCombo` records for this bookingId
3. For each `ComboItemRequest { comboId, quantity }`:
   - Call `GET /combos/{comboId}` on Catalog Service → throw `COMBO_NOT_EXISTED` if not found or soft-deleted
   - Create `BookingCombo { comboId, comboName, quantity, remain=quantity, unitPrice=combo.price, subtotal=unitPrice×quantity }`
4. Recalculate `booking.subtotal += newComboSubtotal`; `booking.totalAmount = subtotal - discount`
5. Return `BookingPricingResponse { subtotal, discount, totalAmount }`

**`remain` field**: Starts equal to `quantity`. Decremented during check-in as staff redeems combo items.

---

## 7. Loyalty Points

### 7.1 Earn (on Payment Confirmed)

```
pointsEarned = totalAmount / 20000   (integer division)
// Example: 150,000 VND → 7 points
```

```
pointsSpent = discount / 1000        (integer division)
// Example: 5,000 VND discount → 5 points
```

Net points added = `pointsEarned - pointsSpent`.

Called by `confirmBookingPayment()` → `customerService.addLoyaltyPoints(customerId, net)`.

### 7.2 Redeem (on Booking Pending)

`POST /bookings/{bookingId}/redeem-points` with `{ pointsToRedeem: N }`:

```
discountAmount = N × 1000 VND
maxDiscount = totalAmount × 50%      (cannot discount more than 50%)
```

Validation:
- `booking.status == PENDING`
- `discountAmount ≤ maxDiscount`
- `N ≤ customer.loyaltyPoints` (fetched from Identity Service sync call)

### 7.3 Reverse (on Refund)

`refundBooking()` calls `customerService.addLoyaltyPoints(customerId, -(pointsEarned - pointsSpent))` — subtracts the net points that were added at confirmation.

---

## 8. API Endpoints

### 8.1 Booking Endpoints

| Method | Endpoint | Access | Request | Response |
|--------|----------|--------|---------|----------|
| `POST` | `/bookings` | Auth | `CreateBookingRequest` | `ApiResponse<CreateBookingResponse>` |
| `GET` | `/bookings` | Auth | query params (see below) | `ApiResponse<BookingListResponse>` |
| `GET` | `/bookings/{bookingId}/summary` | Auth | path | `ApiResponse<BookingSummaryResponse>` |
| `POST` | `/bookings/{bookingId}/redeem-points` | Auth | `DiscountPointRequest` | `ApiResponse<BookingSummaryResponse>` |
| `POST` | `/bookings/{bookingId}/cancel` | Auth | — | `ApiResponse<String>` |
| `POST` | `/bookings/{bookingId}/create-invoice` | Auth | — | `ApiResponse<InvoiceResponse>` |
| `PUT` | `/bookings/{bookingId}/combos` | Auth | `UpdateBookingCombosRequest` | `ApiResponse<BookingPricingResponse>` |

#### `CreateBookingRequest` Fields

| Field | Type | Notes |
|-------|------|-------|
| `customerId` | `String` | nullable — UUID of existing Customer |
| `screeningId` | `String` | Required — which screening to book |
| `screeningSeatIds` | `List<String>` | IDs of `ScreeningSeat` records (→ `seatReservationId` in microservice); max 8 |
| `customerName` | `String` | Optional — for guest/new customer (full name, parsed into first+last) |
| `firstName` | `String` | Optional |
| `lastName` | `String` | Optional |
| `email` | `String` | Optional — used for find-or-create customer |

#### `GET /bookings` Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | `BookingStatus` | null | Filter by status |
| `customerSearch` | `String` | null | Search by customer name |
| `emailSearch` | `String` | null | Search by email |
| `movieSearch` | `String` | null | Search by movie title |
| `cinemaId` | `String` | null | Filter by cinema |
| `page` | `int` | `0` | Page number |
| `size` | `int` | `10` | Page size |

#### `BookingListResponse` (paginated)

```json
{
  "bookings": [...],
  "totalElements": 100,
  "totalPages": 10,
  "currentPage": 0,
  "pageSize": 10
}
```

### 8.2 Ticket Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `GET` | `/tickets/by-booking/{bookingId}` | Auth | List tickets for a booking |
| `GET` | `/tickets/{ticketCode}` | Auth | Get ticket by code |
| `GET` | `/tickets/check-in/{ticketCode}` | Auth | Get ticket + combo view for check-in UI |
| `GET` | `/tickets/my-tickets/{customerId}` | Auth | List tickets for a customer |
| `POST` | `/tickets/check-in/{ticketCode}` | `ADMIN` or `STAFF` | Perform check-in; body contains combo usage |
| `POST` | `/tickets/{ticketCode}/mark-for-transfer` | Auth | Mark ticket for transfer; `?customerId=...` |
| `POST` | `/tickets/{ticketCode}/cancel-transfer` | Auth | Cancel transfer; `?customerId=...` |

#### `TicketCheckInRequest`

```json
{
  "ticketCode": "TK-3FA85F64",
  "comboUseList": [
    { "comboId": "booking-combo-uuid", "quantity": 1 }
  ]
}
```

### 8.3 Combo Endpoints (Booking Service)

> Booking Service does **not** expose Combo catalog CRUD. Those endpoints live in Catalog Service (`/combos`, `/combo-items`). The only combo endpoint here is the one that attaches combos to a booking.

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `PUT` | `/bookings/{bookingId}/combos` | Auth | Replace all combo selections for a booking; calls Catalog Service to validate and snapshot |

### 8.4 SeatReservation Endpoints (Target Design)

> These endpoints do not exist in the monolith. In the monolith, seat listing is via `GET /screeningSeats?screeningId=...`. In the microservice these are the target endpoints.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/seat-reservations/{screeningId}` | Public | Get all seats + status for a screening (seat map) |
| `PUT` | `/seat-reservations/{id}/lock` | Auth | Lock a seat for current customer |
| `PUT` | `/seat-reservations/{id}/unlock` | Auth | Release a held seat |

---

## 9. Kafka Event Contracts

### 9.1 Events Consumed

#### `ScreeningCreated`
- **Topic**: `cinema.catalog.screening-created`
- **Action**: Create one `seat_reservation` per seat in the event `seats[]` array with `status = AVAILABLE`, `price = event.seats[i].price`

```java
// Pseudocode consumer
@KafkaListener(topics = "cinema.catalog.screening-created")
void onScreeningCreated(ScreeningCreatedEvent event) {
    event.getPayload().getSeats().forEach(seat -> {
        seatReservationRepo.save(SeatReservation.builder()
            .screeningId(event.getPayload().getScreeningId())
            .seatId(seat.getSeatId())
            .seatName(seat.getSeatName())
            .seatTypeId(seat.getSeatTypeId())
            .seatTypeName(seat.getSeatTypeName())
            .price(seat.getPrice())
            .status(SeatReservationStatus.AVAILABLE)
            .build());
    });
}
```

#### `ScreeningCancelled`
- **Topic**: `cinema.catalog.screening-cancelled`
- **Action**: Delete or mark all `seat_reservation` records for `screeningId` as cancelled; clear Redis `seat:lock:{screeningId}:*`

#### `PaymentConfirmed`
- **Topic**: `cinema.payment.payment-confirmed`
- **Payload must include**: `bookingId`, `paymentId`, `paidAt`, `amountPaid`
- **Action** (7-step sequence):

| Step | Action |
|------|--------|
| 1 | Receive `PaymentConfirmed` event; idempotency check on `bookingId` (skip if already PAID) |
| 2 | Set `booking.status = PAID` |
| 3 | Set `seat_reservation.status = BOOKED` for all reservations in this booking |
| 4 | Create `Ticket` records via `TicketService.createTickets(bookingId)` |
| 5 | Publish `TicketIssued` event (topic: `cinema.booking.ticket-issued`) — triggers notification QR email |
| 6 | Publish `BookingPaid` event (topic: `cinema.booking.booking-paid`) — provides revenue breakdown to Analytics |
| 7 | Calculate loyalty points (`pointsEarned - pointsSpent`) → Publish `LoyaltyPointsEarned` event |

#### `PaymentFailed`
- **Topic**: `cinema.payment.payment-failed`
- **Payload must include**: `bookingId`
- **Action**: Release all seats for this booking → `status = AVAILABLE`; clear Redis locks; optionally set booking `status = EXPIRED`

### 9.2 Events Published

#### `BookingCreated`
- **Topic**: `cinema.booking.booking-created`
- **Trigger**: After `POST /bookings` succeeds
- **Consumers**: Payment Service (to create invoice), Notification Service (booking confirmation)

```json
{
  "eventId": "uuid",
  "eventType": "BookingCreated",
  "occurredAt": "ISO-8601",
  "payload": {
    "bookingId":    "uuid",
    "bookingCode":  "BK-3FA85F64",
    "customerId":   "uuid | null",
    "customerName": "Nguyen Van A",
    "customerEmail":"customer@email.com",
    "screeningId":  "uuid",
    "movieTitle":   "Avengers: Doomsday",
    "cinemaName":   "Cifastar HCM Q1",
    "roomName":     "Room 1",
    "startTime":    "2026-07-01T10:30:00Z",
    "seats": [
      { "seatReservationId": "uuid", "seatName": "A1", "price": 90000.00 }
    ],
    "subtotal":     270000.00,
    "discount":     0.00,
    "totalAmount":  270000.00,
    "expiredAt":    "ISO-8601"
  }
}
```

#### `BookingCancelled`
- **Topic**: `cinema.booking.booking-cancelled`
- **Trigger**: `POST /bookings/{id}/cancel` or refund
- **Consumers**: Payment Service (trigger refund), Notification Service

```json
{
  "eventType": "BookingCancelled",
  "payload": {
    "bookingId":   "uuid",
    "bookingCode": "BK-3FA85F64",
    "customerId":  "uuid | null",
    "reason":      "CUSTOMER_CANCEL | PAYMENT_FAILED | ADMIN",
    "totalAmount": 270000.00
  }
}
```

#### `TicketIssued`
- **Topic**: `cinema.booking.ticket-issued`
- **Trigger**: After `createTickets()` succeeds (inside `confirmBookingPayment()`)
- **Consumers**: Notification Service (sends ticket email with `ticketCode`)

```json
{
  "eventType": "TicketIssued",
  "payload": {
    "bookingId":   "uuid",
    "customerId":  "uuid",
    "accountId":   "uuid",
    "movieTitle":  "Avengers: Doomsday",
    "cinemaName":  "Cifastar HCM Q1",
    "startTime":   "ISO-8601",
    "tickets": [
      {
        "ticketId":    "uuid",
        "ticketCode":  "TK-3FA85F64",
        "seatName":    "A1",
        "price":       90000.00
      }
    ]
  }
}
```

#### `LoyaltyPointsEarned`
- **Topic**: `cinema.booking.loyalty-points-earned`
- **Trigger**: After `confirmBookingPayment()` — points calculation done (Step 7 of PaymentConfirmed consumer)
- **Consumers**: Identity Service (apply `addLoyaltyPoints` to customer)
- **Note**: In the microservice, `customerService.addLoyaltyPoints()` is replaced by publishing this event. Identity Service consumes it and updates `customer.loyaltyPoints`.

```json
{
  "eventType": "LoyaltyPointsEarned",
  "payload": {
    "customerId":    "uuid",
    "bookingId":     "uuid",
    "pointsEarned":  7,
    "pointsSpent":   5,
    "netPointChange": 2
  }
}
```

#### `BookingPaid`
- **Topic**: `cinema.booking.booking-paid`
- **Trigger**: Published after Step 5 (TicketIssued) in the PaymentConfirmed consumer sequence
- **Consumers**: Analytics Service
- **Note**: Provides revenue breakdown data (`cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold`, `screeningDate`) that Payment Service cannot provide in `PaymentConfirmed`.

```json
{
  "eventType": "BookingPaid",
  "payload": {
    "bookingId":        "uuid",
    "paymentId":        "uuid — echoed from PaymentConfirmed for Analytics correlation",
    "paidAt":           "ISO-8601",
    "customerId":       "uuid | null",
    "movieId":          "uuid",
    "movieTitle":       "Avengers: Doomsday",
    "cinemaId":         "uuid",
    "cinemaName":       "Cifastar HCM Q1",
    "screeningId":      "uuid",
    "ticketRevenue":    270000.00,
    "comboRevenue":     75000.00,
    "totalAmount":      345000.00,
    "discount":         0.00,
    "totalTicketsSold": 3,
    "screeningDate":    "2026-07-01"
  }
}
```

---

## 10. Data Ownership

**Booking Service owns exclusively:**

| Table | Notes |
|-------|-------|
| `seat_reservations` | NEW — created from `ScreeningCreated` events |
| `bookings` | Core booking record |
| `booking_combos` | Denormalized combo snapshot per booking; FK to `bookings` |
| `tickets` | One per seat per paid booking |

**Cross-domain references to resolve in microservice**:
- `booking.customer` → `customerId: String` (identity is resolved from JWT `sub` claim)
- `booking.screening` → `screeningId: String` + denormalized fields
- `ticket.screeningSeat` → `seatReservationId: UUID`
- `bookingCombo.comboId` → cross-domain ref to Catalog Service `combos.id` (no FK constraint; resolved at order time via REST)

> **`combos` and `combo_items` tables are no longer owned by Booking Service.** They are managed entirely by Catalog Service.

---

## 11. Error Codes (Booking-related)

| Error Code | HTTP | When Thrown |
|-----------|------|-------------|
| `BOOKING_NOT_EXISTED` | 400 | Booking not found |
| `BOOKING_EXCEED_SEAT_LIMIT` | 400 | More than 8 seats selected |
| `SCREENING_SEATS_NOT_AVAILABLE` | 400 | One or more seats are already locked/sold |
| `ORPHAN_SEAT_VIOLATION` | 400 | Seat selection would leave a single isolated available seat |
| `MOVIE_ALREADY_ENDED` | 400 | Movie status is `archived`; booking refused |
| `INSUFFICIENT_LOYALTY_POINTS` | 400 | Customer has fewer points than requested to redeem |
| `COMBO_NOT_EXISTED` | 400 | Combo is soft-deleted or not found |
| `BOOKING_COMBO_NOT_EXISTED` | 400 | BookingCombo record not found during check-in |
| `INSUFFICIENT_COMBO_QUANTITY` | 400 | `remain < requested quantity` at check-in |
| `TICKET_NOT_EXISTED` | 400 | Ticket not found by ticketCode |
| `TICKET_NOT_ACTIVE` | 400 | Ticket status is not `ACTIVE` |
| `TICKET_EXPIRED` | 400 | Ticket is past `expiresAt` |
| `UNAUTHORIZED` | 403 | Customer does not own the ticket |

---

## 12. Enums Reference

| Enum | Values | Notes |
|------|--------|-------|
| `BookingStatus` | `PENDING`, ~~`CONFIRM`~~ **[DEPRECATED]**, `PAID`, `EXPIRED`, `CANCELLED`, `REFUNDED` | `CONFIRM` defined in monolith but never set; **remove from microservice enum** |
| `SeatReservationStatus` | `AVAILABLE`, `LOCKED`, `BOOKED` | New enum for microservice; replaces `ScreeningSeatStatus` |
| `ScreeningSeatStatus` *(mono only)* | `AVAILABLE`, `LOCKED`, `SOLD` | Used in monolith; `SOLD` → `BOOKED` in microservice |
| `TicketStatus` | `ACTIVE`, `USED`, `CANCELLED`, `EXPIRED`, `FOR_TRANSFER` | |

---

## 13. Key Implementation Notes for Migration

1. **Price re-computation in `createBooking()`**: In the monolith, `calculateSeatSubtotal()` re-queries `PriceConfig` at booking time (duplicates Catalog logic). In the microservice, the `seat_reservation.price` is already the authoritative snapshot from `ScreeningCreated`. `booking.subtotal = SUM(seatReservation.price)` — no re-computation needed.

2. **`CustomerService` sync call**: `redeemPoints()` calls `customerService.getLoyaltyPoints()` — in the microservice this is a synchronous REST call to Identity Service. Consider caching or using an event-sourced model.

3. **`CONFIRM` status is dead code** (**Q9 decision**): `BookingStatus.CONFIRM` is defined in the monolith enum but is never assigned in any service method (`createBooking`, `confirmBookingPayment`, `cancelBooking`, `refundBooking`). **Decision**: remove from the microservice `BookingStatus` enum entirely. The state machine is `PENDING → PAID` directly on `PaymentConfirmed`; there is no intermediate confirmation state.

4. **Ticket `qrContent` field**: The `qr_content` column stores a JSON string, not a QR image. In the microservice spec says "QR code removed" — clarify with team if this JSON payload should be simplified to just `ticketCode` or removed entirely from the Ticket entity.

5. **`Ticket.screeningSeat` cross-domain FK**: Replace with `seatReservationId: UUID` (reference to Booking Service's own `seat_reservations` table).

6. **Booking `create-invoice` endpoint**: `POST /bookings/{id}/create-invoice` calls `InvoiceService.createInvoice()` directly in the monolith. In the microservice, this becomes an async event (`BookingCreated` triggers Payment Service to offer invoice creation).

7. **Redis implementation**: The monolith uses zero Redis. All seat locking is DB-only. The Redis `seat:lock:{screeningId}:{seatId}` layer is entirely new work.

8. **Guest booking (null customer)**: Allowed in mono (counter staff can book without a customer account). In the microservice, decide if guest bookings are still in-scope — they require special handling since no `customerId` means no JWT claim to verify ownership.

---

## Appendix: Class Reference

| Class | Package | Role |
|-------|---------|------|
| `Booking` | `booking.entity` | Core booking entity |
| `BookingServiceImpl` | `booking.service` | All booking logic: create, cancel, confirm, refund, list |
| `DiscountService` | `booking.service` | Loyalty points: earn, redeem, reverse |
| `BookingController` | `booking.controller` | REST endpoints for bookings |
| `BookingCombo` | `bookingCombo.entity` | Denormalized combo snapshot per booking |
| `BookingComboServiceImpl` | `bookingCombo.service` | Update/replace combos; calls Catalog Service REST to validate combo; get combos for check-in |
| `BookingComboController` | `bookingCombo.controller` | `PUT /bookings/{id}/combos` |
| `ScreeningSeat` | `screeningSeat.entity` | **Transitional → becomes `SeatReservation`** |
| `ScreeningSeatStatus` | `screeningSeat.enums` | `AVAILABLE/LOCKED/SOLD` → renamed `BOOKED` |
| `Ticket` | `ticket.entity` | Ticket issued after payment |
| `TicketServiceImpl` | `ticket.service` | Create tickets, check-in, expire, transfer |
| `TicketController` | `ticket.controller` | REST endpoints for tickets |
| `TicketCodeGenerator` | `ticket.service` | `"TK-" + UUID(8).toUpperCase()` |
| `QrGenerator` | `ticket.service` | JSON `{"type":"TICKET","ticketCode":"..."}` |

---

*Updated: 2026-06-24 | Source: direct code read of all entities, services, controllers, mappers, enums in `booking/`, `bookingCombo/`, `screeningSeat/`, `ticket/` packages. `combo/` package moved to Catalog Service.*
