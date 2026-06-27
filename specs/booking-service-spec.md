# Booking Service — Specification

> **Source**: Direct code read on 2026-06-21. Updated 2026-06-25 to align with target DDL.
> **Port**: 8083
> **Database**: PostgreSQL 15 (Supabase) | Partitioning by showtime_date | Optimistic locking
> **Cache**: Redis
> **Message Broker**: Kafka (consume `ShowtimeCreated`, `ShowtimeCancelled`, `PaymentConfirmed`, `PaymentFailed`; publish `BookingCreated`, `BookingCancelled`, `BookingConfirmed`, `TicketIssued`, `LoyaltyPointsEarned`)

---

## 1. Service Overview

The Booking Service is the central transactional hub of the cinema system. It manages:
- **SeatReservation**: Persistent status (`AVAILABLE`/`LOCKED`/`RESERVED`/`CONFIRMED`/`CANCELLED`) + ephemeral Redis lock (8-min TTL)
- **Booking**: Full lifecycle from `INITIATED` → `CONFIRMED`/`COMPLETED`/`CANCELLED`/`FAILED`
- **BookingCombo**: F&B items attached to a booking (denormalized price snapshot from Catalog Service)
- **Ticket**: One ticket per seat per booking; issued after payment confirmed
- **BookingOutbox**: Transactional outbox for reliable at-least-once Kafka event delivery
- **BookingIdempotencyKey**: Prevents duplicate booking requests from retries

> **Combo and ComboItem catalog** are owned by **Catalog Service** (see `catalog-service-spec.md §6.10–6.11`). Booking Service calls `GET /combos/{comboId}` on Catalog Service via REST to validate availability and snapshot the price into `BookingCombo`.

**Key design principle**: Booking Service holds **no live FK references** to Catalog Service tables. All catalog data (movieTitle, hallName, showtimeId, seatId, seatName, seatTypeName, price) is **snapshotted** either from the `ShowtimeCreated` Kafka event or at booking creation time.

---

## 2. Domain Model

### 2.1 Entity Graph

```
ShowtimeCreated (Kafka)
        │
        ▼
SeatReservation [N per showtime]
        │ (1 per CONFIRMED seat)
        ▼
Booking ──── User ──── (Identity Service cross-domain ref)
   │
   ├──── BookingCombo [N] ──── comboId (cross-domain ref → Catalog Service)
   │
   ├──── Ticket [1 per seat]
   │
   ├──── BookingOutbox [N] ──── Transactional Outbox
   │
   └──── BookingIdempotencyKey [1] ──── idempotency_key
```

---

### 2.2 Entity Definitions

---

#### SeatReservation (replaces monolith `ScreeningSeat`)

**Target table**: `seat_reservations`

> **Design**: `seat_reservations` are created **per booking** (not pre-created from `ShowtimeCreated` events). `booking_id` is `NOT NULL`, meaning each seat reservation is immediately linked to a parent booking. Status defaults to `'LOCKED'` on creation. Seat expiry is managed via `bookings.expires_at` (not a separate `lock_expires_at` column).

| Field | Column (DDL) | Type | Constraints | Description |
|-------|-------------|------|-------------|-------------|
| `id` | `id` | `UUID` | PK DEFAULT gen_random_uuid() | |
| `bookingId` | `booking_id` | `UUID` | NOT NULL REFERENCES bookings(id) ON DELETE CASCADE | FK to parent booking; row deleted when booking deleted |
| `showtimeId` | `showtime_id` | `UUID` | NOT NULL | Routing key; mirrors `bookings.showtime_id` |
| `seatId` | `seat_id` | `UUID` | NOT NULL | Cross-domain ref to Catalog/Hall Service seat (no FK constraint) |
| `rowLabel` | `row_label` | `VARCHAR(4)` | NOT NULL | e.g. `"A"`, `"B"` |
| `seatNumber` | `seat_number` | `SMALLINT` | NOT NULL | e.g. `1`, `5` |
| `seatType` | `seat_type` | `VARCHAR(32)` | NOT NULL | `STANDARD`, `PREMIUM`, or `VIP` |
| `price` | `price` | `NUMERIC(10,2)` | NOT NULL | **Immutable snapshot** from showtime pricing; never recalculated |
| `status` | `status` | `seat_status` enum | NOT NULL DEFAULT `'LOCKED'` | `AVAILABLE` / `LOCKED` / `RESERVED` / `CONFIRMED` / `CANCELLED` |
| `redisLockKey` | `redis_lock_key` | `VARCHAR(255)` | nullable | Mirror of the Redis key stored for audit/debugging |
| `lockedAt` | `locked_at` | `TIMESTAMPTZ` | nullable | When the seat was locked |
| `confirmedAt` | `confirmed_at` | `TIMESTAMPTZ` | nullable | Set when booking transitions to `CONFIRMED` |
| `releasedAt` | `released_at` | `TIMESTAMPTZ` | nullable | When seat was released back to `AVAILABLE` |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Record creation time |

**Unique constraint (partial)**: `UNIQUE (showtime_id, seat_id) WHERE status NOT IN ('CANCELLED')` — prevents double-booking of the same seat across non-cancelled reservations for the same showtime.

**Indexes**:
- `ux_seat_res_showtime_seat ON seat_reservations(showtime_id, seat_id) WHERE status NOT IN ('CANCELLED')` (UNIQUE)
- `ix_seat_res_booking_id ON seat_reservations(booking_id)`
- `ix_seat_res_showtime_status ON seat_reservations(showtime_id, status)`

> **Migration from monolith `ScreeningSeat`**: `seatName` → `row_label` + `seat_number`. `seatTypeId`/`seatTypeName` → `seat_type VARCHAR(32)`. `lockUntil` removed — expiry now on `bookings.expires_at`. `booking` (String, nullable) → `booking_id (UUID, NOT NULL)`. `screening_id` → `showtime_id`. Status `SOLD` renamed to `CONFIRMED`.

---

#### Booking

**Table**: `bookings`
**Partition**: `PARTITION BY RANGE (showtime_date)` — partitioned by showtime date for query performance and data archival.

> **Key schema changes from monolith**: `customer_id` → `user_id` (UUID from JWT); `screening_id` → `showtime_id`; `expired_at` → `expires_at` (8-min hold); `subtotal`/`discount` removed — `total_amount` is the single source of truth. Added `hall_id`, `cinema_id`, `idempotency_key`, `payment_ref`, `version` (optimistic lock), `currency`, `updated_at`. Status renamed: `PENDING` → `INITIATED`, `PAID` → `CONFIRMED`/`COMPLETED`, `EXPIRED`/`REFUNDED` → `FAILED`/`CANCELLED`.

| Field | Column (DDL) | Type | Constraints | Description |
|-------|-------------|------|-------------|-------------|
| `id` | `id` | `UUID` | PK DEFAULT gen_random_uuid() | |
| `userId` | `user_id` | `UUID` | NOT NULL, `ix_bookings_user_id` | Identity Service user; resolved from JWT `sub` claim |
| `showtimeId` | `showtime_id` | `UUID` | NOT NULL, `ix_bookings_showtime_id` | Which showtime is being booked |
| `cinemaId` | `cinema_id` | `UUID` | NOT NULL, `ix_bookings_cinema_id` | Partition/routing key for Kafka even partitioning |
| `hallId` | `hall_id` | `UUID` | NOT NULL | Hall (screen room) within the cinema |
| `showtimeDate` | `showtime_date` | `DATE` | NOT NULL | **Partition column** — used for `PARTITION BY RANGE (showtime_date)` |
| `status` | `status` | `booking_status` enum | NOT NULL DEFAULT `'INITIATED'` | See state machine §5.1 |
| `totalAmount` | `total_amount` | `NUMERIC(10,2)` | NOT NULL CHECK `>= 0` | Net payable amount (seats + combos − discounts) |
| `currency` | `currency` | `CHAR(3)` | NOT NULL DEFAULT `'SGD'` | ISO 4217 currency code |
| `idempotencyKey` | `idempotency_key` | `UUID` | NOT NULL, `ux_bookings_idempotency` | Client-supplied per booking attempt; prevents duplicate bookings |
| `paymentRef` | `payment_ref` | `UUID` | nullable | `payment_id` echoed from Payment Service on confirmation |
| `expiresAt` | `expires_at` | `TIMESTAMPTZ` | NOT NULL | Seat-hold expiry (`created_at + 8 minutes`) |
| `confirmedAt` | `confirmed_at` | `TIMESTAMPTZ` | nullable | When payment was confirmed |
| `cancelledAt` | `cancelled_at` | `TIMESTAMPTZ` | nullable | When booking was cancelled |
| `cancellationReason` | `cancellation_reason` | `TEXT` | nullable | Free-text cancellation reason |
| `version` | `version` | `BIGINT` | NOT NULL DEFAULT `0` | **Optimistic locking** — incremented on every UPDATE |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | |
| `updatedAt` | `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Auto-updated on every write |

**Indexes**:
- `ux_bookings_idempotency ON bookings(idempotency_key)` (UNIQUE)
- `ix_bookings_user_id ON bookings(user_id)`
- `ix_bookings_showtime_id ON bookings(showtime_id)`
- `ix_bookings_cinema_id ON bookings(cinema_id)`
- `ix_bookings_status ON bookings(status) WHERE status NOT IN ('COMPLETED','CANCELLED')`
- `ix_bookings_expires_at ON bookings(expires_at) WHERE status = 'INITIATED'`

**Derived field (application-level, not stored in DB)**:
```java
bookingCode = "BK-" + id.toString().substring(0, 8).toUpperCase()
// Example: "BK-3FA85F64"
```

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
| `quantity` | `Integer` | `quantity` | NOT NULL | How many units ordered |
| `remain` | `Integer` | `remain` | NOT NULL | Remaining units (decremented at check-in) |
| `unitPrice` | `BigDecimal` | `unit_price` | NOT NULL | **Snapshot** of `combo.price` at order time |
| `subtotal` | `BigDecimal` | `subtotal` | NOT NULL | `unitPrice × quantity` |

> **Design note**: `comboName` and `unitPrice` are snapshots. If the combo price or name changes later, the existing booking is unaffected. `remain` tracks partial combo redemption during check-in.

---

#### BookingOutbox

**Table**: `booking_outbox`

> **Transactional Outbox pattern**: Instead of publishing Kafka events directly (which can fail silently if the broker is down), the service writes an outbox record **within the same DB transaction** as the business operation. A separate relay process reads `PENDING` outbox records and publishes them to Kafka, then marks them `PUBLISHED`. This guarantees at-least-once delivery without distributed transactions.

| Field | Column (DDL) | Type | Constraints | Description |
|-------|-------------|------|-------------|-------------|
| `id` | `id` | `UUID` | PK DEFAULT gen_random_uuid() | |
| `aggregateType` | `aggregate_type` | `VARCHAR(64)` | NOT NULL | Domain aggregate — e.g. `Booking` |
| `aggregateId` | `aggregate_id` | `UUID` | NOT NULL | ID of the aggregate that raised the event |
| `eventType` | `event_type` | `VARCHAR(128)` | NOT NULL | e.g. `booking.confirmed` |
| `payload` | `payload` | `JSONB` | NOT NULL | Full event payload |
| `kafkaTopic` | `kafka_topic` | `VARCHAR(255)` | NOT NULL | Target Kafka topic |
| `partitionKey` | `partition_key` | `VARCHAR(64)` | NOT NULL | `cinema_id` for even partitioning across brokers |
| `status` | `status` | `VARCHAR(16)` | NOT NULL DEFAULT `'PENDING'` | `PENDING` → `PUBLISHED` or `FAILED` |
| `attemptCount` | `attempt_count` | `SMALLINT` | NOT NULL DEFAULT `0` | Number of publish attempts (for retry backoff) |
| `publishedAt` | `published_at` | `TIMESTAMPTZ` | nullable | Timestamp when successfully published to Kafka |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | |

**Index**: `ix_outbox_status_created ON booking_outbox(status, created_at) WHERE status = 'PENDING'`

---

#### BookingIdempotencyKey

**Table**: `booking_idempotency_keys`

> **Idempotency**: Protects against duplicate booking requests caused by network retries. The client supplies an `idempotency_key` (UUID) per request attempt. The service checks this table before processing; if a matching key exists, it returns the cached response instead of reprocessing. Records expire after 24 hours.

| Field | Column (DDL) | Type | Constraints | Description |
|-------|-------------|------|-------------|-------------|
| `idempotencyKey` | `idempotency_key` | `UUID` | PRIMARY KEY | Client-supplied unique key per request attempt |
| `bookingId` | `booking_id` | `UUID` | NOT NULL REFERENCES bookings(id) | The booking created for this request |
| `userId` | `user_id` | `UUID` | NOT NULL | The user who made the request |
| `requestHash` | `request_hash` | `VARCHAR(64)` | NOT NULL | SHA-256 hash of the request body; detects changed payloads |
| `responseStatus` | `response_status` | `SMALLINT` | NOT NULL | HTTP status code of the original response |
| `responseBody` | `response_body` | `JSONB` | nullable | Cached response body to replay on duplicate request |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | |
| `expiresAt` | `expires_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() + INTERVAL '24 hours' | TTL — cleaned up by scheduler after expiry |

---

#### Ticket

**Package**: `ticket.entity.Ticket`
**Table**: `tickets`

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `UUID` | `id` | PK, `@GeneratedValue(UUID)` | |
| `bookingId` | `UUID` | `booking_id` | NOT NULL, FK, `@Index idx_ticket_booking` | |
| `seatReservationId` | `UUID` | `seat_reservation_id` | NOT NULL, FK, UNIQUE | References `seat_reservations.id` (replaces monolith `screeningSeat`) |
| `seatName` | `String` | `seat_name` | VARCHAR(10) | Denormalized: `rowLabel + seatNumber` (e.g. `"A1"`) |
| `price` | `BigDecimal` | `price` | NOT NULL, `precision=10, scale=2` | Copied from `SeatReservation.price` at ticket creation |
| `ticketCode` | `String` | `ticket_code` | NOT NULL, UNIQUE, VARCHAR(50), `@Index` | `"TK-" + UUID(8 chars uppercase)` |
| `qrContent` | `String` | `qr_content` | NOT NULL, TEXT | JSON string (see format below) |
| `status` | `TicketStatus` | `status` | NOT NULL, `@Index idx_ticket_status` | Default: `ACTIVE` |
| `usedAt` | `Instant` | `used_at` | nullable | Set on check-in |
| `expiresAt` | `Instant` | `expires_at` | NOT NULL | = `showtime.endTime` (Asia/Ho_Chi_Minh zone) |
| `createdAt` | `Instant` | `created_at` | NOT NULL, `@CreationTimestamp` | |

---

## 3. Database DDL

### 3.1 Full Schema (PostgreSQL 15 / Supabase)

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- BOOKING SERVICE DATABASE SCHEMA
-- PostgreSQL 15 (Supabase) | Partitioning by showtime_date | Optimistic locking
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enum Types ──────────────────────────────────────────────────────────────
CREATE TYPE seat_status AS ENUM ('AVAILABLE','LOCKED','RESERVED','CONFIRMED','CANCELLED');
CREATE TYPE booking_status AS ENUM
('INITIATED','CONFIRMED','PAYMENT_PENDING','COMPLETED','CANCELLED','FAILED');

-- ── bookings (RANGE-partitioned by showtime_date) ───────────────────────────
CREATE TABLE bookings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL,
    showtime_id          UUID NOT NULL,
    cinema_id            UUID NOT NULL,            -- partition/routing key
    hall_id              UUID NOT NULL,
    showtime_date        DATE NOT NULL,            -- partition column
    status               booking_status NOT NULL DEFAULT 'INITIATED',
    total_amount         NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    currency             CHAR(3) NOT NULL DEFAULT 'SGD',
    idempotency_key      UUID NOT NULL,            -- client-supplied per attempt
    payment_ref          UUID,                     -- payment_id from Payment svc
    expires_at           TIMESTAMPTZ NOT NULL,     -- lock expiry (now + 8 min)
    confirmed_at         TIMESTAMPTZ,
    cancelled_at         TIMESTAMPTZ,
    cancellation_reason  TEXT,
    version              BIGINT NOT NULL DEFAULT 0, -- optimistic lock
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (showtime_date);

-- Partitions managed manually or via pg_partman (future)

-- ── seat_reservations ───────────────────────────────────────────────────────
CREATE TABLE seat_reservations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    showtime_id      UUID NOT NULL,
    seat_id          UUID NOT NULL,
    row_label        VARCHAR(4) NOT NULL,
    seat_number      SMALLINT NOT NULL,
    seat_type        VARCHAR(32) NOT NULL,  -- STANDARD, PREMIUM, VIP
    price            NUMERIC(10,2) NOT NULL,
    status           seat_status NOT NULL DEFAULT 'LOCKED',
    redis_lock_key   VARCHAR(255),          -- mirror of Redis key for audit
    locked_at        TIMESTAMPTZ,
    confirmed_at     TIMESTAMPTZ,
    released_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── booking_outbox (Transactional Outbox pattern) ───────────────────────────
CREATE TABLE booking_outbox (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type   VARCHAR(64) NOT NULL,    -- e.g. Booking
    aggregate_id     UUID NOT NULL,
    event_type       VARCHAR(128) NOT NULL,   -- e.g. booking.confirmed
    payload          JSONB NOT NULL,
    kafka_topic      VARCHAR(255) NOT NULL,
    partition_key    VARCHAR(64) NOT NULL,    -- cinema_id for even partitioning
    status           VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    attempt_count    SMALLINT NOT NULL DEFAULT 0,
    published_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── booking_idempotency_keys ─────────────────────────────────────────────────
CREATE TABLE booking_idempotency_keys (
    idempotency_key  UUID PRIMARY KEY,
    booking_id       UUID NOT NULL REFERENCES bookings(id),
    user_id          UUID NOT NULL,
    request_hash     VARCHAR(64) NOT NULL,
    response_status  SMALLINT NOT NULL,
    response_body    JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- ── INDEXES ──────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX ux_bookings_idempotency ON bookings(idempotency_key);
CREATE INDEX ix_bookings_user_id ON bookings(user_id);
CREATE INDEX ix_bookings_showtime_id ON bookings(showtime_id);
CREATE INDEX ix_bookings_cinema_id ON bookings(cinema_id);
CREATE INDEX ix_bookings_status ON bookings(status)
    WHERE status NOT IN ('COMPLETED','CANCELLED');
CREATE INDEX ix_bookings_expires_at ON bookings(expires_at)
    WHERE status = 'INITIATED';

CREATE UNIQUE INDEX ux_seat_res_showtime_seat ON seat_reservations(showtime_id, seat_id)
    WHERE status NOT IN ('CANCELLED');
CREATE INDEX ix_seat_res_booking_id ON seat_reservations(booking_id);
CREATE INDEX ix_seat_res_showtime_status ON seat_reservations(showtime_id, status);

CREATE INDEX ix_outbox_status_created ON booking_outbox(status, created_at)
    WHERE status = 'PENDING';
```

---

## 4. SeatReservation Design

### 4.1 Status Transition Diagram

```
[POST /bookings — createBooking]
         │
         ▼
      LOCKED  ──────────────────────────────── AVAILABLE
         │    TTL expires (8 min)              (Redis key
         │    OR PaymentFailed event            auto-evicts)
         │    OR BookingCancelled              │
         │                                     │
   PaymentConfirmed event                      │
         │                                     │
         ▼                                     │
      CONFIRMED ──── BookingCancelled ─────► CANCELLED
         │
   Booking COMPLETED
         │
     (terminal)
```

### 4.2 Redis Seat Lock

| Property | Value |
|----------|-------|
| **Key** | `seat:lock:{showtimeId}:{seatId}` |
| **Value** | JSON: `{"userId": "...", "lockedAt": "ISO-8601"}` |
| **TTL** | **8 minutes** |
| **Data type** | Redis `STRING` with `EX` |

**Set when**: `POST /bookings` — for each seat in the request
```redis
SET seat:lock:{showtimeId}:{seatId} '{"userId":"...","lockedAt":"..."}' EX 480
```

**Released when**:
- TTL expires (Redis auto-evicts; a scheduled job or Redis keyspace notification triggers `status = AVAILABLE`)
- `POST /bookings/{id}/cancel` (explicit unlock)
- `PaymentFailed` Kafka event received (release all seats in booking)

**Ownership check**: On booking creation, verify the Redis key is not already set by a different user. If set → `SEAT_ALREADY_LOCKED`.

> **⚠️ Monolith note**: The monolith does **not use Redis** for seat locking. It uses an atomic SQL `UPDATE` to set `status = LOCKED` and `lockUntil = now + 10 min`. The Redis layer is entirely new work for the microservice.

### 4.3 Seat Locking (Monolith Reference)

The monolith's lock mechanism uses a custom `@Query`:

```java
// SeatReservationRepository (replaces monolith ScreeningSeatRepository)
@Modifying
@Query("UPDATE SeatReservation s SET s.status = 'LOCKED', s.lockUntil = :expiresAt " +
       "WHERE s.id IN :ids AND s.status = 'AVAILABLE' AND " +
       "(s.lockUntil IS NULL OR s.lockUntil < CURRENT_TIMESTAMP)")
int lockSeats(@Param("ids") List<String> ids, @Param("expiresAt") Instant expiresAt);
```

The return value (updated row count) is compared to the requested count — if they differ, some seats were already locked → `SHOWTIME_SEATS_NOT_AVAILABLE`.

### 4.4 Orphan Seat Validation

`BookingServiceImpl.validateSeatReservation()` enforces a cinema UX rule: **you cannot leave a single isolated available seat between occupied/selected seats in a row**.

The algorithm:
1. Groups seats by row
2. For each affected row, marks seats as: `2=selected`, `1=occupied`, `0=available`
3. Rejects bookings that would create an orphan pattern:
   - A `0` surrounded by two `2`s in adjacent positions
   - A `0` adjacent to a `1` with a `2` on the other side, while there's no "safe gap" (≥2 consecutive available seats) elsewhere in that row

---

## 5. Booking Lifecycle

### 5.1 BookingStatus State Machine

| Status | Meaning |
|--------|---------|
| `INITIATED` | Booking created; seats are `LOCKED`; awaiting payment; expires in 8 min |
| `PAYMENT_PENDING` | Payment initiated at Payment Service; awaiting confirmation |
| `CONFIRMED` | Payment confirmed; seats are `CONFIRMED`; tickets issued |
| `COMPLETED` | Booking fully settled (showtime passed, tickets used) |
| `CANCELLED` | Cancelled by customer or admin; seats released |
| `FAILED` | Payment failed or booking expired; seats released |

### 5.2 Transition Table

| From | To | Trigger | Side Effects |
|------|----|---------|--------------|
| *(none)* | `INITIATED` | `POST /bookings` | Seats → `LOCKED`; `expires_at = now + 8min`; outbox + idempotency records written |
| `INITIATED` | `PAYMENT_PENDING` | Payment initiated | `payment_ref` set |
| `PAYMENT_PENDING` | `CONFIRMED` | `PaymentConfirmed` Kafka event | Seats → `CONFIRMED`; Tickets created; `LoyaltyPointsEarned` published |
| `CONFIRMED` | `COMPLETED` | System / scheduler after showtime ends | Final settled state |
| `INITIATED` | `CANCELLED` | `POST /bookings/{id}/cancel` | Seats → `CANCELLED`; Redis locks cleared |
| `PAYMENT_PENDING` | `CANCELLED` | `POST /bookings/{id}/cancel` | Seats → `CANCELLED`; Redis locks cleared |
| `INITIATED` | `FAILED` | TTL expires / `PaymentFailed` event | Seats → `AVAILABLE`; Redis locks cleared |
| `PAYMENT_PENDING` | `FAILED` | `PaymentFailed` Kafka event | Seats → `AVAILABLE`; Redis locks cleared |

### 5.3 Booking Creation Flow (Detailed)

`POST /bookings` → `createBooking(CreateBookingRequest)`:

1. **Check idempotency**: Look up `idempotency_key` in `booking_idempotency_keys` — if found and `request_hash` matches, return cached response; if `request_hash` differs → `IDEMPOTENCY_KEY_CONFLICT`
2. **Validate seat count**: `0 < seatCount ≤ 8` → `BOOKING_EXCEED_SEAT_LIMIT`
3. **Load showtime**: must exist → `SHOWTIME_NOT_EXISTED`
4. **Validate seat selection**: `validateSeatReservation()` — checks orphan seat rule
5. **Atomic seat lock**: `seatReservationRepository.lockSeats(ids, expiresAt)` — CAS-style UPDATE; if locked count ≠ requested count → `SHOWTIME_SEATS_NOT_AVAILABLE`
6. **Resolve user**: from JWT `sub` claim
7. **Calculate total amount**: `SUM(seatReservation.price)` — uses pre-snapshotted prices; no re-computation against Catalog
8. **Persist booking**: `status = INITIATED`, `total_amount = sum`, `expires_at = now + 8min`, `version = 0`
9. **Write outbox record** (same transaction): `BookingCreated` event → `booking_outbox`
10. **Write idempotency record** (same transaction): → `booking_idempotency_keys`
11. **Return**: `CreateBookingResponse { id, expiresAt, totalAmount, userId }`

### 5.4 User Resolution

All bookings in the microservice require an authenticated user. `userId` is resolved from JWT `sub` claim. Guest (unauthenticated) bookings are not supported in the microservice design.

---

## 6. Ticket Design

### 6.1 Ticket Code Format

```
"TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
```

**Example**: `TK-3FA85F64`

- Length: **11 characters** (`TK-` + 8 hex chars)
- Unique: enforced by DB `UNIQUE` constraint on `ticket_code` + loop-retry in `generateUniqueCode()`
- **Not a UUID** — it is an 8-char hex substring of a UUID, prefixed with `TK-`

### 6.2 QR Content (stored in `qr_content` column)

```json
{"type": "TICKET", "ticketCode": "TK-3FA85F64"}
```

Generated by `QrGenerator.generateQrContent(ticketCode)` using Jackson `ObjectMapper`. This is a **text string** stored in the DB, not an image. The frontend renders it as a QR code image using a JS library.

### 6.3 Ticket Creation (when triggered)

`TicketService.createTickets(bookingId)` is called inside `confirmBookingPayment()` (triggered by `PaymentConfirmed` event):

1. Verify `booking.status == CONFIRMED`
2. Load all `SeatReservation` records with `booking_id = bookingId`
3. Set `expiresAt = showtime.endTime` (converted to UTC from `Asia/Ho_Chi_Minh`)
4. For each seat:
   - Generate unique `ticketCode` (retry until unique)
   - Generate `qrContent` JSON
   - Copy `price` from `SeatReservation.price`
   - Set `status = ACTIVE`
5. Persist all tickets
6. Write `TicketIssued` event to `booking_outbox` (same transaction)

### 6.4 Check-in Validation

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

### 6.5 Ticket Status Transitions

```
ACTIVE ─── checkInTicket() / checkInByQr() ──► USED
ACTIVE ─── now > expiresAt ─────────────────► EXPIRED (set lazily on next access or by scheduler)
ACTIVE ─── markTicketForTransfer() ─────────► FOR_TRANSFER (must be ≥1 hour before showtime)
FOR_TRANSFER ─── cancelTicketTransfer() ────► ACTIVE
```

**Ticket Transfer Rules**:
- Can mark for transfer only if `status == ACTIVE` and `showtime.startTime - now >= 1 hour`
- `FOR_TRANSFER` tickets are visible on the seat map to other customers who can "claim" them

### 6.6 Ticket Expiry Scheduler

`TicketService.expireTickets()` — scheduled job that batch-sets all `ACTIVE` tickets with `expiresAt < now` to `EXPIRED`. Also `expireTicketsByBookingId(bookingId)` — called on booking cancellation or failure.

---

## 7. Combo in Booking Service

> **Catalog data is owned by Catalog Service.** `Combo` and `ComboItem` entities are defined and managed in `catalog-service-spec.md §6.10–6.11`. This section documents only how Booking Service *uses* combos to create `BookingCombo` records.

### 7.1 Cross-Service Call Flow

When a customer selects combos for a booking, Booking Service calls Catalog Service via **synchronous REST**:

```
PUT /bookings/{bookingId}/combos
  └→ for each comboId: GET http://catalog-service/combos/{comboId}
       └→ validate combo exists and is not soft-deleted
       └→ snapshot { comboId, comboName, price } into BookingCombo
```

### 7.2 Booking Combo Flow

`PUT /bookings/{bookingId}/combos` — replaces all combo selections for a booking:

1. Verify `booking.status == INITIATED` and `expiresAt > now`
2. Delete all existing `BookingCombo` records for this `bookingId`
3. For each `ComboItemRequest { comboId, quantity }`:
   - Call `GET /combos/{comboId}` on Catalog Service → throw `COMBO_NOT_EXISTED` if not found or soft-deleted
   - Create `BookingCombo { comboId, comboName, quantity, remain=quantity, unitPrice=combo.price, subtotal=unitPrice×quantity }`
4. Recalculate `booking.total_amount += newComboSubtotal`
5. Return `BookingPricingResponse { totalAmount }`

**`remain` field**: Starts equal to `quantity`. Decremented during check-in as staff redeems combo items.

---

## 8. Loyalty Points

### 8.1 Earn (on Payment Confirmed)

```
pointsEarned = totalAmount / 20000   (integer division)
// Example: 150,000 VND → 7 points
```

```
pointsSpent = discount / 1000        (integer division)
// Example: 5,000 VND discount → 5 points
```

Net points added = `pointsEarned - pointsSpent`.

Called by `confirmBookingPayment()` → Publish `LoyaltyPointsEarned` event via outbox to Identity Service.

### 8.2 Redeem (on Booking Initiated)

`POST /bookings/{bookingId}/redeem-points` with `{ pointsToRedeem: N }`:

```
discountAmount = N × 1000 VND
maxDiscount = totalAmount × 50%      (cannot discount more than 50%)
```

Validation:
- `booking.status == INITIATED`
- `discountAmount ≤ maxDiscount`
- `N ≤ user.loyaltyPoints` (fetched from Identity Service sync REST call)

### 8.3 Reverse (on Cancellation after CONFIRMED)

On booking cancellation after status `CONFIRMED`, publish `LoyaltyPointsReversed` event — subtracts the net points that were added at confirmation.

---

## 9. API Endpoints

### 9.1 Booking Endpoints

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
| `userId` | `String` | Resolved from JWT `sub` claim |
| `showtimeId` | `String` | Required — which showtime to book |
| `seatReservationIds` | `List<String>` | IDs of seats to reserve; max 8 |
| `idempotencyKey` | `UUID` | Required — client-supplied per request attempt |
| `currency` | `String` | Optional — defaults to `SGD` |

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

### 9.2 Ticket Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `GET` | `/tickets/by-booking/{bookingId}` | Auth | List tickets for a booking |
| `GET` | `/tickets/{ticketCode}` | Auth | Get ticket by code |
| `GET` | `/tickets/check-in/{ticketCode}` | Auth | Get ticket + combo view for check-in UI |
| `GET` | `/tickets/my-tickets/{userId}` | Auth | List tickets for a user |
| `POST` | `/tickets/check-in/{ticketCode}` | `ADMIN` or `STAFF` | Perform check-in; body contains combo usage |
| `POST` | `/tickets/{ticketCode}/mark-for-transfer` | Auth | Mark ticket for transfer |
| `POST` | `/tickets/{ticketCode}/cancel-transfer` | Auth | Cancel transfer |

#### `TicketCheckInRequest`

```json
{
  "ticketCode": "TK-3FA85F64",
  "comboUseList": [
    { "comboId": "booking-combo-uuid", "quantity": 1 }
  ]
}
```

### 9.3 Combo Endpoints (Booking Service)

> Booking Service does **not** expose Combo catalog CRUD. Those endpoints live in Catalog Service (`/combos`, `/combo-items`). The only combo endpoint here is the one that attaches combos to a booking.

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `PUT` | `/bookings/{bookingId}/combos` | Auth | Replace all combo selections for a booking; calls Catalog Service to validate and snapshot |

### 9.4 SeatReservation Endpoints

> In the monolith, seat listing is via `GET /showtime-seats?showtimeId=...`. In the microservice these are the target endpoints.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/seat-reservations/{showtimeId}` | Public | Get all seats + status for a showtime (seat map) |
| `PUT` | `/seat-reservations/{id}/lock` | Auth | Lock a seat for current user |
| `PUT` | `/seat-reservations/{id}/unlock` | Auth | Release a held seat |

---

## 10. Kafka Event Contracts

### 10.1 Events Consumed

#### `ShowtimeCreated`
- **Topic**: `cinema.catalog.showtime-created`
- **Action**: Pre-populate `seat_reservations` with `status = AVAILABLE` for each seat in the showtime

```java
// Pseudocode consumer
@KafkaListener(topics = "cinema.catalog.showtime-created")
void onShowtimeCreated(ShowtimeCreatedEvent event) {
    event.getPayload().getSeats().forEach(seat -> {
        seatReservationRepo.save(SeatReservation.builder()
            .showtimeId(event.getPayload().getShowtimeId())
            .seatId(seat.getSeatId())
            .rowLabel(seat.getRowLabel())
            .seatNumber(seat.getSeatNumber())
            .seatType(seat.getSeatType())
            .price(seat.getPrice())
            .status(SeatReservationStatus.AVAILABLE)
            .build());
    });
}
```

#### `ShowtimeCancelled`
- **Topic**: `cinema.catalog.showtime-cancelled`
- **Action**: Mark all `seat_reservations` for `showtimeId` as `CANCELLED`; cancel any `INITIATED`/`PAYMENT_PENDING` bookings for that showtime; clear Redis `seat:lock:{showtimeId}:*`

#### `PaymentConfirmed`
- **Topic**: `cinema.payment.payment-confirmed`
- **Payload must include**: `bookingId`, `paymentId`, `confirmedAt`, `amountPaid`
- **Action** (7-step sequence):

| Step | Action |
|------|--------|
| 1 | Receive `PaymentConfirmed` event; idempotency check on `bookingId` (skip if already `CONFIRMED`) |
| 2 | Set `booking.status = CONFIRMED`; `booking.payment_ref = paymentId`; `booking.confirmed_at = confirmedAt` |
| 3 | Set `seat_reservation.status = CONFIRMED` for all reservations in this booking |
| 4 | Create `Ticket` records via `TicketService.createTickets(bookingId)` |
| 5 | Write `TicketIssued` event to outbox (topic: `cinema.booking.ticket-issued`) — triggers notification |
| 6 | Write `BookingConfirmed` event to outbox (topic: `cinema.booking.booking-confirmed`) — Analytics |
| 7 | Calculate loyalty points → Write `LoyaltyPointsEarned` event to outbox |

#### `PaymentFailed`
- **Topic**: `cinema.payment.payment-failed`
- **Payload must include**: `bookingId`
- **Action**: Set `booking.status = FAILED`; release all `seat_reservations` → `AVAILABLE`; clear Redis locks

### 10.2 Events Published

> All events are written to `booking_outbox` within the business transaction and relayed to Kafka asynchronously.

#### `BookingCreated`
- **Topic**: `cinema.booking.booking-created`
- **Trigger**: After `POST /bookings` succeeds
- **Consumers**: Payment Service (to create invoice), Notification Service

```json
{
  "eventId": "uuid",
  "eventType": "BookingCreated",
  "occurredAt": "ISO-8601",
  "payload": {
    "bookingId":    "uuid",
    "bookingCode":  "BK-3FA85F64",
    "userId":       "uuid",
    "showtimeId":   "uuid",
    "movieTitle":   "Avengers: Doomsday",
    "cinemaName":   "Cifastar HCM Q1",
    "hallName":     "Hall 1",
    "startTime":    "2026-07-01T10:30:00Z",
    "seats": [
      { "seatReservationId": "uuid", "seatName": "A1", "price": 90000.00 }
    ],
    "totalAmount":  270000.00,
    "expiresAt":    "ISO-8601"
  }
}
```

#### `BookingCancelled`
- **Topic**: `cinema.booking.booking-cancelled`
- **Trigger**: `POST /bookings/{id}/cancel` or `PaymentFailed` event
- **Consumers**: Payment Service (trigger refund if applicable), Notification Service

```json
{
  "eventType": "BookingCancelled",
  "payload": {
    "bookingId":   "uuid",
    "bookingCode": "BK-3FA85F64",
    "userId":      "uuid",
    "reason":      "CUSTOMER_CANCEL | PAYMENT_FAILED | SHOWTIME_CANCELLED | ADMIN",
    "totalAmount": 270000.00
  }
}
```

#### `TicketIssued`
- **Topic**: `cinema.booking.ticket-issued`
- **Trigger**: After `createTickets()` succeeds (Step 5 of `PaymentConfirmed` consumer)
- **Consumers**: Notification Service (sends ticket email with `ticketCode`)

```json
{
  "eventType": "TicketIssued",
  "payload": {
    "bookingId":   "uuid",
    "userId":      "uuid",
    "movieTitle":  "Avengers: Doomsday",
    "cinemaName":  "Cifastar HCM Q1",
    "startTime":   "ISO-8601",
    "tickets": [
      {
        "ticketId":   "uuid",
        "ticketCode": "TK-3FA85F64",
        "seatName":   "A1",
        "price":      90000.00
      }
    ]
  }
}
```

#### `LoyaltyPointsEarned`
- **Topic**: `cinema.booking.loyalty-points-earned`
- **Trigger**: Step 7 of `PaymentConfirmed` consumer
- **Consumers**: Identity Service (apply `addLoyaltyPoints` to user account)

```json
{
  "eventType": "LoyaltyPointsEarned",
  "payload": {
    "userId":         "uuid",
    "bookingId":      "uuid",
    "pointsEarned":   7,
    "pointsSpent":    5,
    "netPointChange": 2
  }
}
```

#### `BookingConfirmed`
- **Topic**: `cinema.booking.booking-confirmed`
- **Trigger**: Step 6 of `PaymentConfirmed` consumer sequence
- **Consumers**: Analytics Service
- **Note**: Provides revenue breakdown (`cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold`, `showtimeDate`) that Payment Service cannot supply in `PaymentConfirmed`.

```json
{
  "eventType": "BookingConfirmed",
  "payload": {
    "bookingId":        "uuid",
    "paymentId":        "uuid",
    "confirmedAt":      "ISO-8601",
    "userId":           "uuid",
    "movieId":          "uuid",
    "movieTitle":       "Avengers: Doomsday",
    "cinemaId":         "uuid",
    "cinemaName":       "Cifastar HCM Q1",
    "showtimeId":       "uuid",
    "ticketRevenue":    270000.00,
    "comboRevenue":     75000.00,
    "totalAmount":      345000.00,
    "totalTicketsSold": 3,
    "showtimeDate":     "2026-07-01"
  }
}
```

---

## 11. Data Ownership

**Booking Service owns exclusively:**

| Table | Notes |
|-------|-------|
| `bookings` | Core booking record; RANGE-partitioned by `showtime_date` |
| `seat_reservations` | One row per seat per booking; replaces monolith `ScreeningSeat` |
| `booking_combos` | Denormalized combo snapshot per booking; FK to `bookings` |
| `tickets` | One per seat per confirmed booking |
| `booking_outbox` | Transactional outbox for reliable Kafka event publishing |
| `booking_idempotency_keys` | Idempotency store — prevents duplicate booking requests |

**Cross-domain references**:
- `bookings.user_id` → Identity Service user (resolved from JWT `sub` claim)
- `bookings.showtime_id` → Showtime Service (no FK; referenced as UUID)
- `seat_reservations.seat_id` → Catalog/Hall Service seat (no FK constraint; data snapshotted at lock time)
- `booking_combos.combo_id` → Catalog Service `combos.id` (no FK constraint; validated at order time via REST)

> **`combos` and `combo_items` tables are no longer owned by Booking Service.** They are managed entirely by Catalog Service.

---

## 12. Error Codes (Booking-related)

| Error Code | HTTP | When Thrown |
|-----------|------|-------------|
| `BOOKING_NOT_EXISTED` | 400 | Booking not found |
| `BOOKING_EXCEED_SEAT_LIMIT` | 400 | More than 8 seats selected |
| `SHOWTIME_NOT_EXISTED` | 400 | Showtime not found |
| `SHOWTIME_SEATS_NOT_AVAILABLE` | 400 | One or more seats are already locked or reserved |
| `SEAT_ALREADY_LOCKED` | 409 | Seat is currently held by another user (Redis lock conflict) |
| `ORPHAN_SEAT_VIOLATION` | 400 | Seat selection would leave a single isolated available seat |
| `INSUFFICIENT_LOYALTY_POINTS` | 400 | User has fewer points than requested to redeem |
| `COMBO_NOT_EXISTED` | 400 | Combo is soft-deleted or not found in Catalog Service |
| `BOOKING_COMBO_NOT_EXISTED` | 400 | BookingCombo record not found during check-in |
| `INSUFFICIENT_COMBO_QUANTITY` | 400 | `remain < requested quantity` at check-in |
| `TICKET_NOT_EXISTED` | 400 | Ticket not found by `ticketCode` |
| `TICKET_NOT_ACTIVE` | 400 | Ticket status is not `ACTIVE` |
| `TICKET_EXPIRED` | 400 | Ticket is past `expiresAt` |
| `UNAUTHORIZED` | 403 | User does not own this ticket or booking |
| `IDEMPOTENCY_KEY_CONFLICT` | 409 | Same `idempotency_key` reused with a different request payload |

---

## 13. Enums Reference

| Enum | Values | Notes |
|------|--------|-------|
| `BookingStatus` | `INITIATED`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `FAILED` | Replaces monolith: `PENDING`→`INITIATED`, `PAID`→`CONFIRMED`/`COMPLETED`, `EXPIRED`/`REFUNDED`→`FAILED`/`CANCELLED`. `CONFIRM` dead code removed. |
| `SeatReservationStatus` | `AVAILABLE`, `LOCKED`, `RESERVED`, `CONFIRMED`, `CANCELLED` | Maps to `seat_status` DB enum. Replaces monolith `ScreeningSeatStatus` (`AVAILABLE/LOCKED/SOLD`). |
| `TicketStatus` | `ACTIVE`, `USED`, `CANCELLED`, `EXPIRED`, `FOR_TRANSFER` | |
| `OutboxStatus` | `PENDING`, `PUBLISHED`, `FAILED` | Status of a `booking_outbox` record |

---

## 14. Key Implementation Notes for Migration

1. **Price snapshot in `createBooking()`**: In the monolith, `calculateSeatSubtotal()` re-queries `PriceConfig` at booking time. In the microservice, `seat_reservation.price` is already the authoritative snapshot from `ShowtimeCreated`. `booking.total_amount = SUM(seatReservation.price)` — no re-computation needed.

2. **Loyalty points async**: In the monolith, `redeemPoints()` calls `customerService.getLoyaltyPoints()` synchronously. In the microservice, validation is a sync REST call to Identity Service, but point changes are applied via async `LoyaltyPointsEarned` / `LoyaltyPointsReversed` events.

3. **`BookingStatus` enum renamed**: Monolith `PENDING` → `INITIATED`; `PAID` → `CONFIRMED` then `COMPLETED`; `REFUNDED` → reversed via event after `CANCELLED`; `EXPIRED` → `FAILED`. `CONFIRM` was dead code in the monolith — removed entirely.

4. **Ticket `qrContent` field**: The `qr_content` column stores a JSON string, not a QR image. Clarify with team if this JSON payload should be simplified to just `ticketCode` or removed.

5. **`Ticket.seatReservationId`**: Replaces monolith `Ticket.screeningSeat` cross-domain FK. References Booking Service's own `seat_reservations` table.

6. **Booking `create-invoice` endpoint**: `POST /bookings/{id}/create-invoice` triggers Payment Service in the microservice via the `BookingCreated` outbox event — not a direct sync call.

7. **Redis implementation**: The monolith uses zero Redis. All seat locking is DB-only. The Redis `seat:lock:{showtimeId}:{seatId}` layer is entirely new work.

8. **Transactional Outbox**: All Kafka events are written to `booking_outbox` within the same DB transaction as the business operation. A relay process (polling or Debezium CDC) reads and publishes them, ensuring no event is lost if Kafka is temporarily unavailable.

9. **Idempotency store**: The `booking_idempotency_keys` table stores the request hash and cached response. On duplicate requests with the same key, the cached response is returned. Records expire after 24 hours (cleaned by scheduler).

10. **Optimistic Locking**: `bookings.version` is incremented on every UPDATE. Concurrent updates detect version conflicts and return `409 Conflict` or retry with exponential backoff.

---

## Appendix: Class Reference

| Class | Package | Role |
|-------|---------|------|
| `Booking` | `booking.entity` | Core booking entity |
| `BookingServiceImpl` | `booking.service` | All booking logic: create, cancel, confirm, fail, list |
| `DiscountService` | `booking.service` | Loyalty points: earn, redeem, reverse |
| `BookingController` | `booking.controller` | REST endpoints for bookings |
| `BookingCombo` | `bookingCombo.entity` | Denormalized combo snapshot per booking |
| `BookingComboServiceImpl` | `bookingCombo.service` | Update/replace combos; calls Catalog Service REST to validate; get combos for check-in |
| `BookingComboController` | `bookingCombo.controller` | `PUT /bookings/{id}/combos` |
| `SeatReservation` | `seatReservation.entity` | Seat reservation per booking (replaces monolith `ScreeningSeat`) |
| `SeatReservationStatus` | `seatReservation.enums` | `AVAILABLE/LOCKED/RESERVED/CONFIRMED/CANCELLED` |
| `SeatReservationRepository` | `seatReservation.repository` | JPA repo; `lockSeats()` CAS-style update |
| `BookingOutbox` | `outbox.entity` | Transactional outbox record |
| `OutboxRelayService` | `outbox.service` | Polls `booking_outbox` and publishes to Kafka; marks records `PUBLISHED` |
| `BookingIdempotencyKey` | `idempotency.entity` | Idempotency record per request attempt |
| `IdempotencyService` | `idempotency.service` | Check / store idempotency keys; replay cached responses |
| `Ticket` | `ticket.entity` | Ticket issued after payment confirmed |
| `TicketServiceImpl` | `ticket.service` | Create tickets, check-in, expire, transfer |
| `TicketController` | `ticket.controller` | REST endpoints for tickets |
| `TicketCodeGenerator` | `ticket.service` | `"TK-" + UUID(8).toUpperCase()` |
| `QrGenerator` | `ticket.service` | JSON `{"type":"TICKET","ticketCode":"..."}` |

---

*Updated: 2026-06-25 | Aligned with target DDL (PostgreSQL 15 / Supabase). All `screening` references renamed to `showtime`. Added `booking_outbox` (Transactional Outbox pattern) and `booking_idempotency_keys`. `BookingStatus` enum updated: `INITIATED/PAYMENT_PENDING/CONFIRMED/COMPLETED/CANCELLED/FAILED`. `SeatReservationStatus` updated: `AVAILABLE/LOCKED/RESERVED/CONFIRMED/CANCELLED`. `seat_reservations` replaces monolith `ScreeningSeat` entirely.*
