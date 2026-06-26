# Catalog Service — Specification

> **Source**: Direct code read on 2026-06-20.
> **Port**: 8082
> **Database**: PostgreSQL (per-service schema)
> **Cache**: Redis
> **Message Broker**: Kafka (publish `ScreeningCreated`, `ScreeningCancelled`)

---

## 1. Service Overview

The Catalog Service is the **authoritative source of truth** for all static and scheduling content:
- **Movie content**: Movie, Genre, AgeRating
- **Physical infrastructure**: Cinema, Room, Seat, SeatType
- **Pricing configuration**: PriceConfig (DayType × TimeSlot × SeatType)
- **Screenings**: Scheduling, conflict detection, status lifecycle
- **F&B Combo catalog**: Combo, ComboItem — managed here; Booking Service only stores the denormalized `BookingCombo` snapshot

It is a **consumer of no Kafka events** and a **producer of two Kafka events** (`ScreeningCreated`, `ScreeningCancelled`). All other services read from it either via synchronous REST (Booking, Analytics) or by consuming its Kafka events (Booking).

---

## 2. Domain Model

### 2.1 Entity Graph

```
AgeRating  ──┐
Genre[]    ──┤
             ├──► Movie ──────────────────────────────► Screening ──► Room ──► Cinema
SeatType ──► Seat ──► Room ──► Cinema                              │
             └──────────────────────────────────────────────────────┘
PriceConfig (DayType × TimeSlot × SeatType)

Combo ──── ComboItem[]
(F&B catalog; read by Booking Service via REST when processing /bookings/{id}/combos)
```

### 2.2 BaseEntity (common for all entities)

All entities extend `BaseEntity` which provides:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (UUID) | `@GeneratedValue(UUID)` — PK as string |
| `createdAt` | `LocalDateTime` | `@CreationTimestamp`, not updatable |
| `updatedAt` | `LocalDateTime` | `@UpdateTimestamp` |
| `deleted` | `Boolean` | Default `false`; soft-delete pattern |

> **All catalog entities use soft delete** via `@SQLDelete` (sets `deleted=true`) and `@Where(clause = "deleted = false")`. Deleted records are invisible to all queries.

---

### 2.3 Entity Definitions

#### Movie

**Package**: `movie.entity.Movie`
**Table**: `movies`

| Field | Java Type | DB Type | Notes |
|-------|-----------|---------|-------|
| `id` | `String` | UUID | PK (from BaseEntity) |
| `title` | `String` | VARCHAR | |
| `slug` | `String` | VARCHAR | UNIQUE; auto-generated from title via `SlugUtil` |
| `description` | `String` | TEXT | |
| `durationMinutes` | `Integer` | INT | |
| `director` | `String` | VARCHAR | |
| `castMembers` | `String` | TEXT | Stored as a single string (comma-separated or freeform) |
| `posterUrl` | `String` | VARCHAR | Cloudinary URL |
| `trailerUrl` | `String` | VARCHAR | YouTube/external URL |
| `releaseDate` | `LocalDate` | DATE | |
| `endDate` | `LocalDate` | DATE | |
| `ageRating` | `AgeRating` | FK → `age_ratings.id` | `@ManyToOne EAGER` |
| `status` | `MovieStatus` | VARCHAR(20) | Enum: `now_showing`, `coming_soon`, `archived` |
| `genres` | `Set<Genre>` | Join table `movie_genres` | `@ManyToMany LAZY`, cascade PERSIST+MERGE |
| `createdAt` | `LocalDateTime` | TIMESTAMP | from BaseEntity |
| `updatedAt` | `LocalDateTime` | TIMESTAMP | from BaseEntity |
| `deleted` | `Boolean` | BOOLEAN | from BaseEntity; soft-delete flag |

**Business rules:**
- Slug is unique; generated from title; if collision, a numeric suffix is appended (e.g. `avatar-2`)
- Cannot be archived if there are `SCHEDULED` screenings linked to this movie → throws `MOVIE_HAS_SCHEDULED_SCREENINGS`
- `shouldShowArchiveWarning`: returns `true` when movie is `now_showing` and has **no** upcoming screenings in the next 7 days (admin warning signal, not enforcement)

---

#### Genre

**Package**: `movie.entity.Genre`
**Table**: `genres`

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `name` | `String` | Genre name |
| `movies` | `Set<Movie>` | `@ManyToMany(mappedBy="genres")` `@JsonIgnore` |

---

#### AgeRating

**Package**: `movie.entity.AgeRating`
**Table**: `age_ratings`

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `code` | `String` | e.g. `P`, `K`, `T13`, `T16`, `T18`, `C` |
| `description` | `String` | Human-readable description |

---

#### Cinema

**Package**: `cinema.entity.Cinema`
**Table**: `cinemas`
**Soft-delete**: yes

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `name` | `String` | Branch name |
| `address` | `String` | Street address |
| `city` | `String` | |
| `phoneNumber` | `String` | |
| `buffer` | `Integer` | Time buffer between screenings (minutes) |
| `manager` | `Staff` | `@OneToOne` FK → `staffs.id` via `managerId` column |

> **Note**: `manager` is a cross-domain reference to `Staff` from the Identity domain. In the microservice architecture, this FK must be replaced with a `managerId: String` (denormalized) and the manager's name/profile fetched via REST from Identity Service.

---

#### Room

**Package**: `room.entity.Room`
**Table**: `rooms`
**Soft-delete**: yes

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `name` | `String` | Room name/number |
| `cinema` | `Cinema` | `@ManyToOne LAZY` FK → `cinemas.id` |
| `seats` | `List<Seat>` | `@OneToMany(mappedBy="room", CascadeType.ALL)` |
| `roomType` | `RoomType` | Enum: `STANDARD`, `IMAX`, `FOUR_DX`, `GOLD_CLASS` (from `common.enums.RoomType`) — *values verified from RoomType.java on 2026-06-21* |
| `status` | `RoomStatus` | Enum: `ACTIVE`, `INACTIVE`, `MAINTENANCE` |
| `totalSeats` | `Integer` | Denormalized count; used by screening detail |

---

#### Seat

**Package**: `seat.entity.Seat`
**Table**: `seats`
**Soft-delete**: yes

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `rowChair` | `String` | Row label, e.g. `"A"`, `"B"` |
| `seatNumber` | `Integer` | Seat number within row, e.g. `5` |
| `room` | `Room` | `@ManyToOne LAZY` |
| `seatType` | `SeatType` | `@ManyToOne LAZY` |

**Derived**: Seat name = `rowChair + seatNumber` → `"A5"` (computed by `ScreeningSeatMapper.combineSeatInfo()`)

> **Note**: Seat does **not** have its own `basePrice`. The price fallback uses `seatType.basePriceModifier` — see Price Snapshot Logic section.

---

#### SeatType

**Package**: `seatType.entity.SeatType`
**Table**: `seatTypes`
**Soft-delete**: yes

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `typeName` | `String` | e.g. `"Standard"`, `"VIP"`, `"Couple"` |
| `basePriceModifier` | `BigDecimal` | **Price fallback** when no matching PriceConfig exists |

> **Critical**: `basePriceModifier` serves as the **fallback price per seat** when no `PriceConfig` matches the `(dayType, timeSlot, seatType)` triple. The `service-boundaries.md` spec describes this as `seat.basePrice` but the actual field is `SeatType.basePriceModifier`.

---

#### PriceConfig

**Package**: `priceConfig.entity.PriceConfig`
**Table**: `priceConfigs`
**Soft-delete**: yes

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `dayType` | `DayType` | Enum: `WEEKDAY`, `WEEKEND` |
| `timeSlot` | `TimeSlot` | Enum: `MORNING`, `AFTERNOON`, `EVENING`, `LATE_NIGHT` |
| `price` | `BigDecimal` | `precision=10, scale=2` — final ticket price in VND |
| `seatType` | `SeatType` | `@ManyToOne LAZY` FK → `seatTypes.id` |

---

#### Screening

**Package**: `screening.entity.Screening`
**Table**: `screenings`
**Soft-delete**: yes (`@SQLDelete` + `@Where`)

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `room` | `Room` | `@ManyToOne LAZY` FK → `rooms.id` (column name: `roomId`) |
| `movie` | `Movie` | `@ManyToOne LAZY` FK → `movies.id` (column name: `movieId`) |
| `startTime` | `LocalDateTime` | Local time (no timezone stored) |
| `endTime` | `LocalDateTime` | Local time (no timezone stored) |
| `status` | `ScreeningStatus` | Enum: `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELED` |

> **⚠️ Note on `Screening` package location**: Screening resides in `screening/` package at the monolith root level — **not** inside `booking/`. In the microservice split, it belongs entirely to **Catalog Service**. The monolith's `screeningSeat` package (which handles the `ScreeningSeat` join entity + pricing) will be split: the pricing/snapshot logic moves to Catalog, and the `seat_reservation` persistence logic moves to Booking Service.

#### ScreeningSeat (Monolith — transitional entity)

**Package**: `screeningSeat.entity.ScreeningSeat`
**Table**: `screeningSeats`
**Soft-delete**: yes

| Field | Java Type | Notes |
|-------|-----------|-------|
| `id` | `String` | PK |
| `screening` | `Screening` | `@ManyToOne LAZY` FK → `screenings.id` |
| `seat` | `Seat` | `@ManyToOne LAZY` FK → `seats.id` |
| `booking` | `String` | bookingId (stored as String, nullable) |
| `status` | `ScreeningSeatStatus` | Enum: `AVAILABLE`, `LOCKED`, `SOLD` |
| `lockUntil` | `Instant` | Nullable; used for Redis-backed seat locking TTL |

> In the microservice target, `ScreeningSeat` is **replaced entirely** by `seat_reservation` in Booking Service (see `kafka-event-schema.md` and `service-boundaries.md`). The price is no longer stored on the `ScreeningSeat`; it is snapshotted into the `ScreeningCreated` event payload and stored in `seat_reservation.price`.

---

#### Combo

**Package (monolith)**: `combo.entity.Combo`
**Table**: `combos`
**Soft-delete**: yes (`@SQLDelete` + `@Where`)

> **Ownership change**: In the monolith, `Combo` and `ComboItem` reside in the `combo/` package which was tightly coupled to `bookingCombo/`. In the microservice architecture, they move entirely to **Catalog Service** — they are F&B catalog data, not booking transactional data. Booking Service only holds `BookingCombo` (a denormalized snapshot).

| Field | Java Type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `String` | `id` | PK (from BaseEntity) |
| `name` | `String` | `name` | Combo display name |
| `description` | `String` | `description` | Description |
| `price` | `BigDecimal` | `price` | Unit price; snapshotted into `BookingCombo.unitPrice` at order time |
| `imageUrl` | `String` | `image_url` | Image URL |
| `deleted` | `Boolean` | `deleted` | Soft-delete flag (from BaseEntity) |
| `createdAt` | `LocalDateTime` | `created_at` | From BaseEntity |
| `updatedAt` | `LocalDateTime` | `updated_at` | From BaseEntity |

**Business rules:**
- Soft-deleted combos are invisible to public listing and cannot be added to new bookings
- `price` changes after a booking do **not** affect existing `BookingCombo` records (snapshot pattern)

---

#### ComboItem

**Package (monolith)**: `combo.entity.ComboItem`
**Table**: `combo_items`
**Soft-delete**: yes

| Field | Java Type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `String` | `id` | PK (from BaseEntity) |
| `combo` | `Combo` | `combo_id` | `@ManyToOne LAZY` FK → `combos.id` |
| `name` | `String` | `name` | Item name, e.g. `"Popcorn (L)"`, `"Coke 500ml"` |
| `quantity` | `Integer` | `quantity` | Default quantity of this item included in the combo |
| `deleted` | `Boolean` | `deleted` | Soft-delete flag (from BaseEntity) |

> **Purpose**: ComboItem is for display/information only (shown on check-in UI and combo detail page). It does **not** affect pricing — the combo's total price is the single `Combo.price` field.

---

## 3. Business Logic

### 3.1 MovieStatus Lifecycle

```
coming_soon ──► now_showing ──► archived
                    │
                    └─ (guard) cannot archive if SCHEDULED screenings exist
```

`getNowShowingMovies()` queries `movieRepository.findNowShowingMovies(MovieStatus.now_showing)`.
`getComingSoonMovies()` queries `movieRepository.findComingSoonMovies(MovieStatus.coming_soon)`.

---

### 3.2 Screening Creation & Validation

`ScreeningService.createScreening()` enforces:

1. `room` must exist → `ROOM_NOT_EXISTED`
2. `movie` must exist → `MOVIE_NOT_EXISTED`
3. `startTime > now()` → `SCREENING_TIME_INVALID`
4. `endTime > startTime` → `SCREENING_TIME_INVALID`
5. No time overlap in same room → `isTimeOverlap(roomId, start, end, excludeId)` query → `SCREENING_TIME_OVERLAP`
6. Sets `status = SCHEDULED`
7. Calls `createScreeningSeatsForRoom()` → creates one `ScreeningSeat` per seat in room (via `ScreeningSeatService.createScreeningSeat()`)

**Update rules**: Only `SCHEDULED` screenings can be updated (`SCREENING_CANNOT_UPDATE`).
**Delete rules**: Cannot delete if any seat has `status = SOLD` (`SCREENING_SEAT_CANNOT_DELETE`). Deletes all `ScreeningSeat` records first (soft-delete), then soft-deletes the Screening.

---

### 3.3 Screening Status Auto-Transition

`ScreeningStatusSchedulerService` (scheduled) auto-transitions screenings:
- `SCHEDULED` → `ONGOING` when `now > startTime`
- `ONGOING` → `COMPLETED` when `now > endTime`

---

## 4. Price Snapshot Logic (Core Algorithm)

### 4.1 How the Current Monolith Computes Prices

Price computation happens in `ScreeningSeatService.mapSeatsListToResponses()`, called on **every read** of screening seats (lazy-computed, not stored). In the Catalog Service microservice, this logic must be **eagerly computed at Screening creation time** and snapshotted into the `ScreeningCreated` Kafka event.

### 4.2 Exact Algorithm

**Inputs**: `screening.startTime`, all `Seat` records for `screening.room`

**Step 1 — Determine `DayType`**

```java
DayType dayType = DayType.from(screening.getStartTime().toLocalDate());
// from() implementation:
DayOfWeek day = date.getDayOfWeek();
return (day == SATURDAY || day == SUNDAY) ? WEEKEND : WEEKDAY;
```

| Input | Result |
|-------|--------|
| Monday–Friday | `WEEKDAY` |
| Saturday, Sunday | `WEEKEND` |
| Public holidays | **NOT handled** — no `HOLIDAY` type exists in `DayType.java`. Despite `service-boundaries.md` mentioning `HOLIDAY`, the actual enum only has `WEEKDAY` and `WEEKEND`. `HOLIDAY` is **not implemented**. |

**Step 2 — Determine `TimeSlot`**

```java
TimeSlot timeSlot = TimeSlot.from(screening.getStartTime().toLocalTime());
// Ranges defined in TimeSlot enum:
```

| TimeSlot | Start (inclusive) | End (exclusive) |
|----------|------------------|----------------|
| `MORNING` | 06:00 | 12:00 |
| `AFTERNOON` | 12:00 | 18:00 |
| `EVENING` | 18:00 | 23:00 |
| `LATE_NIGHT` | 23:00 | 06:00 (next day) |

The `LATE_NIGHT` slot wraps midnight: `contains(time)` uses the inverted check (`!time.isBefore(23:00) || time.isBefore(06:00)`). A screening starting at e.g. `00:30` would be classified as `LATE_NIGHT`.

If `startTime` does not fall into any slot (impossible given the above exhaustive coverage), throws `IllegalArgumentException("Cannot determine timeSlot {time}")`.

**Step 3 — Fetch matching PriceConfigs**

```java
List<PriceConfig> priceConfigs = priceConfigRepository.findByDayTypeAndTimeSlot(dayType, timeSlot);
// Returns ALL price configs matching dayType+timeSlot, across all seat types
```

Build a lookup map: `Map<seatTypeId → price>`

If multiple `PriceConfig` rows exist for the same `(dayType, timeSlot, seatType)`, the **first** one wins (`.collect(Collectors.toMap(..., (existing, replacement) -> existing))`).

**Step 4 — Resolve price per seat**

```java
// From ScreeningSeatMapper.mapPrice():
String seatTypeId = seat.getSeatType().getId();
BigDecimal price = priceMap.getOrDefault(seatTypeId, seat.getSeatType().getBasePriceModifier());
```

| Condition | Price Used |
|-----------|-----------|
| `PriceConfig` found for this `seatTypeId` | `priceConfig.price` |
| No `PriceConfig` for this `seatTypeId` | `seatType.basePriceModifier` (fallback) |
| `seat.seatType == null` | `null` (edge case, should not occur) |

**Step 5 — Output**

The price per seat is currently computed on-the-fly and returned in `ScreeningSeatResponse.price`. In the microservice architecture it must be computed at `POST /screenings` time and embedded in the `ScreeningCreated` event.

### 4.3 Pseudocode for Microservice Screening Creation

```
function createScreening(request):
    room = fetchRoom(request.roomId)
    movie = fetchMovie(request.movieId)

    validateTime(request.startTime, request.endTime)
    validateNoOverlap(request.roomId, request.startTime, request.endTime)

    screening = persist(Screening(movie, room, startTime, endTime, SCHEDULED))

    dayType  = DayType.from(startTime.toLocalDate())   // WEEKDAY or WEEKEND
    timeSlot = TimeSlot.from(startTime.toLocalTime())  // MORNING/AFTERNOON/EVENING/LATE_NIGHT

    priceConfigs = priceConfigRepo.findByDayTypeAndTimeSlot(dayType, timeSlot)
    priceMap = { config.seatType.id → config.price }   // first wins on duplicate

    seats = seatRepo.findByRoomId(room.id)
    seatSnapshots = seats.map(seat ->
        SeatSnapshot(
            seatId       = seat.id,
            seatName     = seat.rowChair + seat.seatNumber,
            seatTypeId   = seat.seatType.id,
            seatTypeName = seat.seatType.typeName,
            price        = priceMap.getOrDefault(seat.seatType.id,
                                                 seat.seatType.basePriceModifier)
        )
    )

    kafkaPublish(ScreeningCreated {
        screeningId = screening.id,
        movieId     = movie.id,
        roomId      = room.id,
        cinemaId    = room.cinema.id,
        startTime   = startTime (ISO-8601 UTC),
        endTime     = endTime (ISO-8601 UTC),
        seats       = seatSnapshots
    })

    return ScreeningResponse
```

---

## 5. Redis Caching Strategy

> **Note**: Redis caching is **not yet implemented** in the monolith codebase. No `@Cacheable`, `@CacheEvict`, `RedisTemplate`, or Redis dependency is found in the current code. The following is the **target design** for the Catalog Service based on `service-boundaries.md`.

| Cache Key Pattern | TTL | Cached Data | Invalidation Trigger |
|------------------|-----|-------------|---------------------|
| `catalog:movie:{movieId}` | 5 min | Full `MovieResponse` DTO (title, genres, ageRating, etc.) | `PUT/PATCH/DELETE /movies/{id}` |
| `catalog:screening:{screeningId}` | 5 min | `ScreeningResponse` (movie, room, start/endTime, status) | `PUT /screenings/{id}`, status auto-transition, `DELETE /screenings/{id}` |
| `catalog:cinema:{cinemaId}` | 10 min | `CinemaResponse` (name, address, city) | `PUT /cinemas/{id}`, `DELETE /cinemas/{id}` |
| `catalog:screenings:movie:{movieId}` | 5 min | `List<ScreeningResponse>` for a movie | Any screening create/update/delete for this movieId |
| `catalog:seats:room:{roomId}` | 10 min | `List<SeatSnapshot>` (seatId, seatName, seatTypeId, seatTypeName) | `POST/DELETE /seats` for this room |

**Cache library**: Spring Cache with Redis backend (`spring-boot-starter-data-redis` + `spring-boot-starter-cache`)

**Cache pattern**: Read-through cache (`@Cacheable`) with write-through invalidation (`@CacheEvict`):
```java
@Cacheable(value = "catalog:movie", key = "#id")
public MovieResponse getMovieById(String id) { ... }

@CacheEvict(value = "catalog:movie", key = "#id")
public MovieResponse updateMovie(String id, ...) { ... }
```

---

## 6. API Endpoints

> ⚠️ **Security fix**: In the monolith, `POST /movies/**`, `POST /cinemas/**`, and `POST /screenings/**` are **missing `@PreAuthorize`** annotations — any authenticated user can call them. In the microservice implementation, **ALL write endpoints (POST / PUT / DELETE) MUST be secured** with `@PreAuthorize("hasRole('ADMIN')")` at the controller level OR enforced via API Gateway route-level authorization. This spec documents the **intended** access level, not the current monolith behaviour.

All endpoints return `ApiResponse<T>` wrapper with `code: 1000` on success. Base path: `/api/theater-mgnt` (monolith). In microservice: `http://catalog-service:8082`.

### 6.1 Movie Endpoints

| Method | Endpoint | Access | Request | Response |
|--------|----------|--------|---------|----------|
| `POST` | `/movies` | **ADMIN only** | `CreateMovieRequest` body | `ApiResponse<MovieResponse>` |
| `GET` | `/movies` | Public | — | `ApiResponse<List<MovieSimpleResponse>>` |
| `GET` | `/movies/{id}` | Public | path: `id` | `ApiResponse<MovieResponse>` |
| `GET` | `/movies/slug/{slug}` | Public | path: `slug` | `ApiResponse<MovieResponse>` |
| `GET` | `/movies/status/{status}` | Public | path: `MovieStatus` | `ApiResponse<List<MovieSimpleResponse>>` |
| `GET` | `/movies/now-showing` | Public | — | `ApiResponse<List<MovieSimpleResponse>>` |
| `GET` | `/movies/coming-soon` | Public | — | `ApiResponse<List<MovieSimpleResponse>>` |
| `GET` | `/movies/search` | Public | query: `title` | `ApiResponse<List<MovieSimpleResponse>>` |
| `GET` | `/movies/genre/{genreId}` | Public | path: `genreId` | `ApiResponse<List<MovieSimpleResponse>>` |
| `PUT` | `/movies/{id}` | **ADMIN only** | `UpdateMovieRequest` body | `ApiResponse<MovieResponse>` |
| `PATCH` | `/movies/{id}/archive` | **ADMIN only** | — | `ApiResponse<MovieResponse>` |
| `DELETE` | `/movies/{id}` | **ADMIN only** | — | `ApiResponse<String>` |

#### `CreateMovieRequest` fields
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `title` | `String` | `@NotNull` | |
| `description` | `String` | | |
| `durationMinutes` | `Integer` | | |
| `director` | `String` | | |
| `castMembers` | `String` | | comma-separated or freeform |
| `posterUrl` | `String` | | |
| `trailerUrl` | `String` | | |
| `releaseDate` | `LocalDate` | | |
| `endDate` | `LocalDate` | | |
| `ageRatingId` | `String` | | FK lookup |
| `status` | `MovieStatus` | | |
| `genreIds` | `List<String>` | | FK lookups |

---

### 6.2 Genre Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `POST` | `/genres` | Auth | Create genre |
| `GET` | `/genres` | Public | List all genres |
| `GET` | `/genres/{id}` | Public | Get genre by ID |
| `PUT` | `/genres/{id}` | Auth | Update genre |
| `DELETE` | `/genres/{id}` | Auth | Soft-delete genre |

---

### 6.3 AgeRating Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `POST` | `/age-ratings` | Auth | Create age rating |
| `GET` | `/age-ratings` | Public | List all age ratings |
| `GET` | `/age-ratings/{id}` | Public | Get by ID |
| `DELETE` | `/age-ratings/{id}` | Auth | Soft-delete |

---

### 6.4 Cinema Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `POST` | `/cinemas` | **ADMIN only** | Create cinema |
| `GET` | `/cinemas` | Public | List all cinemas |
| `GET` | `/cinemas/{cinemaId}` | Auth | Get cinema by ID |
| `PUT` | `/cinemas/{cinemaId}` | **ADMIN only** | Update cinema |
| `DELETE` | `/cinemas/{cinemaId}` | **ADMIN only** | Soft-delete |
| `GET` | `/cinemas/buffer-management` | Auth | Get cinemas with buffer info |
| `PATCH` | `/cinemas/{cinemaId}/buffer` | **ADMIN only** | Update `buffer` (minutes between screenings) |

---

### 6.5 Room Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `POST` | `/rooms` | **ADMIN only** | Create room; links to cinema |
| `GET` | `/rooms` | Auth | List all rooms |
| `GET` | `/rooms/{roomId}` | Auth | Get room by ID |
| `GET` | `/rooms/cinema/{cinemaId}` | Auth | List rooms for a cinema |
| `PUT` | `/rooms/{roomId}` | **ADMIN only** | Update room |
| `DELETE` | `/rooms/{roomId}` | **ADMIN only** | Soft-delete room |

---

### 6.6 SeatType Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `POST` | `/seatTypes` | **ADMIN only** | Create seat type |
| `GET` | `/seatTypes` | Auth | List all seat types |
| `GET` | `/seatTypes/{seatTypeId}` | Auth | Get seat type |
| `PUT` | `/seatTypes/{seatTypeId}` | **ADMIN only** | Update seat type |
| `DELETE` | `/seatTypes/{seatTypeId}` | **ADMIN only** | Soft-delete |

---

### 6.7 Seat Endpoints (read-only public, manage via room setup)

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `GET` | `/seats/room/{roomId}` | Auth | List all seats for a room |

---

### 6.8 PriceConfig Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `POST` | `/priceConfigs` | **ADMIN only** | Create price config |
| `GET` | `/priceConfigs` | Auth | List all price configs |
| `GET` | `/priceConfigs/{priceConfigId}` | Auth | Get by ID |
| `GET` | `/priceConfigs/seatType/{seatTypeId}` | Auth | List by seat type |
| `PUT` | `/priceConfigs/{priceConfigId}` | **ADMIN only** | Update price config |
| `DELETE` | `/priceConfigs/{priceConfigId}` | **ADMIN only** | Soft-delete |

---

### 6.9 Screening Endpoints

| Method | Endpoint | Access | Request | Response |
|--------|----------|--------|---------|----------|
| `POST` | `/screenings` | **ADMIN only** | `ScreeningCreationRequest` | `ApiResponse<ScreeningResponse>` |
| `GET` | `/screenings` | Public | — | `ApiResponse<List<ScreeningResponse>>` |
| `GET` | `/screenings/{screeningId}` | Public | path | `ApiResponse<ScreeningResponse>` |
| `GET` | `/screenings/{screeningId}/detail` | Public | path | `ApiResponse<ScreeningDetailResponse>` |
| `GET` | `/screenings/movie/{movieId}` | Public | path | `ApiResponse<List<ScreeningResponse>>` |
| `GET` | `/screenings/room/{roomId}` | Public | path | `ApiResponse<List<ScreeningResponse>>` |
| `PUT` | `/screenings/{screeningId}` | **ADMIN only** | `ScreeningUpdateRequest` | `ApiResponse<ScreeningResponse>` |
| `DELETE` | `/screenings/{screeningId}` | **ADMIN only** | path | `ApiResponse<String>` |

#### `ScreeningCreationRequest` fields
| Field | Type | Validation |
|-------|------|-----------|
| `roomId` | `String` | `@NotNull` |
| `movieId` | `String` | `@NotNull` |
| `startTime` | `LocalDateTime` | `@NotNull`; must be in future |
| `endTime` | `LocalDateTime` | `@NotNull`; must be after startTime |

#### `ScreeningDetailResponse` fields
| Field | Type | Description |
|-------|------|-------------|
| + all `ScreeningResponse` fields | | |
| `totalSeats` | `Integer` | From `room.totalSeats` |
| `bookedSeats` | `Integer` | Count of `ScreeningSeat` with `status=SOLD` |
| `availableSeats` | `Integer` | `totalSeats - bookedSeats` |

---

### 6.10 Combo Endpoints

> **Owned by Catalog Service.** Booking Service calls `GET /combos/{comboId}` to validate and snapshot the price when a customer adds combos to a booking.

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `POST` | `/combos` | **ADMIN only** | Create combo |
| `GET` | `/combos` | Public | List all active (non-deleted) combos |
| `GET` | `/combos/{comboId}` | Public | Get combo by ID (used by Booking Service at order time) |
| `PUT` | `/combos/{comboId}` | **ADMIN only** | Update combo name/description/price/image |
| `DELETE` | `/combos/{comboId}` | **ADMIN only** | Soft-delete combo |

#### `CreateComboRequest` fields
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `name` | `String` | `@NotBlank` | Display name |
| `description` | `String` | — | Optional |
| `price` | `BigDecimal` | `@NotNull`, `> 0` | Unit price in VND |
| `imageUrl` | `String` | — | Optional image URL |

---

### 6.11 ComboItem Endpoints

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| `POST` | `/combo-items` | **ADMIN only** | Add an item to a combo |
| `GET` | `/combo-items/{comboId}` | Public | List all items for a given combo |
| `DELETE` | `/combo-items/{id}` | **ADMIN only** | Remove item from combo |

#### `CreateComboItemRequest` fields
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `comboId` | `String` | `@NotBlank` | Parent combo ID |
| `name` | `String` | `@NotBlank` | Item name, e.g. `"Popcorn (L)"` |
| `quantity` | `Integer` | `@Min(1)` | Default quantity in this combo |

---

## 7. ScreeningCreated Event Design

### 7.1 Event Payload (Full Design)

```json
{
  "eventId":     "uuid — generated at publish time",
  "eventType":   "ScreeningCreated",
  "occurredAt":  "2026-07-01T10:30:00Z",
  "version":     "v1",
  "source":      "catalog-service",
  "payload": {
    "screeningId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "movieId":     "movie-uuid",
    "movieTitle":  "Avengers: Doomsday",
    "roomId":      "room-uuid",
    "roomName":    "Room 1",
    "cinemaId":    "cinema-uuid",
    "cinemaName":  "Cifastar HCM Q1",
    "startTime":   "2026-07-01T10:30:00Z",
    "endTime":     "2026-07-01T12:45:00Z",
    "dayType":     "WEEKDAY",
    "timeSlot":    "MORNING",
    "seats": [
      {
        "seatId":        "seat-uuid-1",
        "seatName":      "A1",
        "seatTypeId":    "seattype-uuid",
        "seatTypeName":  "Standard",
        "price":         90000.00
      },
      {
        "seatId":        "seat-uuid-2",
        "seatName":      "A2",
        "seatTypeId":    "seattype-uuid",
        "seatTypeName":  "Standard",
        "price":         90000.00
      },
      {
        "seatId":        "seat-uuid-3",
        "seatName":      "B1",
        "seatTypeId":    "seattype-vip-uuid",
        "seatTypeName":  "VIP",
        "price":         150000.00
      }
    ]
  }
}
```

### 7.2 Field-by-Field: New vs Existing in Mono

| Field | Source in Mono | Status | Notes |
|-------|---------------|--------|-------|
| `eventId` | — | **NEW** | UUID generated at publish time |
| `eventType` | — | **NEW** | Fixed string `"ScreeningCreated"` |
| `occurredAt` | — | **NEW** | `Instant.now()` at publish time |
| `version` | — | **NEW** | `"v1"` |
| `source` | — | **NEW** | `"catalog-service"` |
| `payload.screeningId` | `Screening.id` | exists | Direct field |
| `payload.movieId` | `Screening.movie.id` | exists | Already on entity |
| `payload.movieTitle` | `Screening.movie.title` | **NEW (denormalized)** | Add for Notification Service convenience |
| `payload.roomId` | `Screening.room.id` | exists | |
| `payload.roomName` | `Screening.room.name` | **NEW (denormalized)** | Add for readability |
| `payload.cinemaId` | `Screening.room.cinema.id` | exists (via navigation) | Must be explicit in event |
| `payload.cinemaName` | `Screening.room.cinema.name` | **NEW (denormalized)** | Add for Notification convenience |
| `payload.startTime` | `Screening.startTime` | exists (but `LocalDateTime`) | **CHANGE**: serialize as ISO-8601 UTC |
| `payload.endTime` | `Screening.endTime` | exists (but `LocalDateTime`) | **CHANGE**: serialize as ISO-8601 UTC |
| `payload.dayType` | Computed by `DayType.from()` | **NEW** | Computed at event creation |
| `payload.timeSlot` | Computed by `TimeSlot.from()` | **NEW** | Computed at event creation |
| `payload.seats[]` | `createScreeningSeatsForRoom()` | **RESTRUCTURED** | Mono creates `ScreeningSeat` rows; event carries same data as flat list |
| `payload.seats[].seatId` | `Seat.id` | exists | |
| `payload.seats[].seatName` | Computed: `rowChair + seatNumber` | **NEW** | Denormalized in event |
| `payload.seats[].seatTypeId` | `Seat.seatType.id` | exists | |
| `payload.seats[].seatTypeName` | `Seat.seatType.typeName` | **NEW (denormalized)** | For Booking Service display |
| `payload.seats[].price` | Computed by price algorithm | **NEW** | Key addition — snapshotted price |

### 7.3 Consumer Action (Booking Service)

On receiving `ScreeningCreated`, Booking Service creates one `seat_reservation` row per seat:

```sql
INSERT INTO seat_reservations (id, screening_id, seat_id, seat_name, seat_type_id, seat_type_name, price, status, booking_id, lock_until)
VALUES (gen_random_uuid(), :screeningId, :seatId, :seatName, :seatTypeId, :seatTypeName, :price, 'AVAILABLE', null, null)
ON CONFLICT (screening_id, seat_id) DO NOTHING;
```

---

## 8. ScreeningCancelled Event Design

```json
{
  "eventId":    "uuid",
  "eventType":  "ScreeningCancelled",
  "occurredAt": "2026-07-01T08:00:00Z",
  "version":    "v1",
  "source":     "catalog-service",
  "payload": {
    "screeningId": "3fa85f64-...",
    "movieId":     "movie-uuid",
    "roomId":      "room-uuid",
    "cinemaId":    "cinema-uuid",
    "startTime":   "2026-07-01T10:30:00Z",
    "reason":      "ADMIN_CANCEL | null"
  }
}
```

**Trigger**: `DELETE /screenings/{id}` when no seats are `SOLD`. In the microservice, this should also fire when `status` is set to `CANCELED`.

**Consumer Action (Booking Service)**: Delete or mark all `seat_reservation` records for this `screeningId` as cancelled; release Redis seat locks `seat:lock:{screeningId}:*`.

---

## 9. Service Dependencies

### Synchronous (REST)
| Caller | Called Service | Why |
|--------|---------------|-----|
| Booking Service | Catalog Service | Fetch screening details, room info during booking flow |
| Analytics Service | Catalog Service | Fetch movie/cinema names for reports |

### Asynchronous (Kafka — Published)
| Event | Topic | Consumer |
|-------|-------|----------|
| `ScreeningCreated` | `cinema.catalog.screening-created` | Booking Service |
| `ScreeningCancelled` | `cinema.catalog.screening-cancelled` | Booking Service |

### No Kafka Consumption
Catalog Service does **not** consume any Kafka events.

---

## 10. Data Ownership

**Catalog Service owns exclusively:**

| Table | Notes |
|-------|-------|
| `movies` | Includes soft-delete column |
| `genres` | |
| `movie_genres` | Join table (Movie ↔ Genre) |
| `age_ratings` | |
| `cinemas` | Cross-domain ref to `managerId` (Staff) must be denormalized |
| `rooms` | |
| `seats` | |
| `seat_types` | |
| `price_configs` | |
| `screenings` | |
| `combos` | F&B combo catalog; soft-delete |
| `combo_items` | Items within each combo; soft-delete |

> **Cross-domain FK to resolve**: `cinemas.managerId` references `staffs.id` from Identity domain. In the microservice, store only `managerId: String` and fetch manager details via REST from Identity Service when needed.

> **Booking Service** only holds `booking_combos` (denormalized snapshot of combo name + unit price at order time). The `combos` and `combo_items` tables are **never written to by Booking Service**.

---

## 11. Error Codes (Catalog-related)

> All codes cross-reference `specs/shared/api-contracts.md §3 — Full ErrorCode Catalog`.
> **Microservice target range**: `2000–2499` (see api-contracts.md §3 — Error Code Numeric Ranges).
> The "Monolith Code" column shows the actual numeric value from `ErrorCode.java`; the "Microservice Code" column shows the planned value after renumbering during migration.

| Error Name | Monolith Code | Microservice Code | HTTP | When Thrown |
|-----------|--------------|------------------|------|-------------|
| **Movie / Genre / AgeRating** |
| `MOVIE_EXISTED` | `2026` | `2026` | 400 | Duplicate movie title on create |
| `MOVIE_NOT_EXISTED` | `2027` | `2027` | 404 | Movie not found by ID or slug |
| `INVALID_MOVIE_TITLE` | `2028` | `2028` | 400 | Title exceeds max length |
| `INVALID_MOVIE_DESCRIPTION` | `2029` | `2029` | 400 | Description exceeds max length |
| `INVALID_MOVIE_DURATION` | `2030` | `2030` | 400 | Duration outside allowed range |
| `INVALID_MOVIE_DIRECTOR` | `2031` | `2031` | 400 | Director field exceeds max length |
| `INVALID_MOVIE_CAST` | `2032` | `2032` | 400 | Cast field exceeds max length |
| `INVALID_POSTER_URL` | `2033` | `2033` | 400 | Poster URL fails URL validation |
| `INVALID_TRAILER_URL` | `2034` | `2034` | 400 | Trailer URL fails URL validation |
| `INVALID_MOVIE_GENRES` | `2035` | `2035` | 400 | Genre count outside `{min}–{max}` range |
| `MOVIE_HAS_SCHEDULED_SCREENINGS` | `2038` *(was 2036 in monolith — duplicate fixed)* | `2038` | 400 | Archive blocked by active screenings |
| `GENRE_EXISTED` | `2020` | `2020` | 400 | Duplicate genre name |
| `GENRE_NOT_EXISTED` | `2021` | `2021` | 404 | Genre not found by ID |
| `GENRE_ID_REQUIRED` | `2022` | `2022` | 400 | Genre ID field blank |
| `INVALID_GENRE_ID` | `2023` | `2023` | 400 | Genre ID exceeds max length |
| `GENRE_NAME_REQUIRED` | `2024` | `2024` | 400 | Genre name field blank |
| `INVALID_GENRE_NAME` | `2025` | `2025` | 400 | Genre name exceeds max length |
| `GENRE_NAME_EXISTED` | `2037` | `2037` | 400 | Genre name already taken |
| `AGERATING_EXISTED` | `2015` | `2015` | 400 | Duplicate age rating |
| `AGERATING_NOT_EXISTED` | `2016` | `2016` | 404 | Age rating not found |
| `INVALID_AGERATING_ID` | `2017` | `2017` | 400 | Age rating ID exceeds max length |
| `INVALID_AGERATING_CODE` | `2018` | `2018` | 400 | Age rating code outside `{min}–{max}` length |
| `INVALID_AGERATING_DESCRIPTION` | `2019` | `2019` | 400 | Age rating description exceeds max length |
| `AGERATING_CODE_EXISTED` | `2036` | `2036` | 400 | Age rating code already taken |
| **Cinema / Room / Seat / SeatType / PriceConfig** |
| `CINEMA_EXISTED` | `2001` | `2001` | 400 | Duplicate cinema |
| `CINEMA_NOT_EXISTED` | `2002` | `2002` | 400 | Cinema not found |
| `CINEMA_HAS_ROOMS` | `2039` *(was 2052 in monolith — renumbered to avoid excluded range)* | `2039` | 400 | Cannot delete cinema with active rooms |
| `ROOM_EXISTED` | `2003` | `2003` | 400 | Duplicate room in cinema |
| `ROOM_NOT_EXISTED` | `2004` | `2004` | 400 | Room not found |
| `SEATTYPE_EXISTED` | `2005` | `2005` | 400 | Duplicate seat type |
| `SEATTYPE_NOT_EXISTED` | `2006` | `2006` | 400 | Seat type not found |
| `PRICECONFIG_NOT_EXISTED` | `2007` | `2007` | 400 | Price config not found |
| `PRICECONFIG_EXISTED` | `2008` | `2008` | 400 | Duplicate price config |
| `SEAT_NOT_EXISTED` | `2009` | `2009` | 400 | Seat not found |
| `SEAT_EXISTED` | `2010` | `2010` | 400 | Duplicate seat |
| `SEAT_NOT_IN_ROOM` | `4006` | `2006` *(target — currently overlaps; rename in microservice)* | 400 | Seat not belonging to screening's room |
| **Screening** |
| `SCREENING_EXISTED` | `2013` | `2013` | 400 | Duplicate screening |
| `SCREENING_NOT_EXISTED` | `2014` | `2014` | 400 | Screening not found |
| `SCREENING_TIME_INVALID` | `4004` | `2040` *(target — new allocation in microservice)* | 400 | `startTime` in past or `endTime ≤ startTime` |
| `SCREENING_TIME_OVERLAP` | `4005` | `2041` *(target)* | 400 | Time conflict in same room within buffer |
| `SCREENING_CANNOT_UPDATE` | `4003` | `2042` *(target)* | 400 | Only `SCHEDULED` screenings can be updated |
| **Screening Seat** |
| `SCREENING_SEAT_EXISTED` | `4002` | `2043` *(target)* | 400 | Duplicate `ScreeningSeat` record |
| `SCREENING_SEAT_NOT_EXISTED` | `4001` | `2044` *(target)* | 400 | `ScreeningSeat` not found |
| `SCREENING_SEAT_CANNOT_DELETE` | `4008` | `2045` *(target)* | 400 | Cannot delete if any seat is `SOLD` |
| `SCREENING_SEAT_INVALID_STATUS_CHANGE` | `4007` | `2046` *(target)* | 400 | Cannot revert `SOLD → AVAILABLE` |
| **Staff / Auth cross-check** |
| `STAFF_NOT_FOUND` | `2043` | `2047` *(target — disambiguate from SCREENING_SEAT_EXISTED)* | 400 | Staff ID not found when assigning to cinema |
| `UNAUTHORIZED_CINEMA_STAFF` | `2044` | `2048` *(target)* | 400 | Staff does not belong to requesting cinema |
| **Generic** |
| `NOTHING_TO_UPDATE` | `2050` | `2050` | 400 | Update request had no changed fields |

> **Migration note**: Codes marked with *(target)* are those where the monolith uses codes in the `4001–4008` range (originally the `screeningSeat` module) which conflict with the Analytics Service's target range (`4000–4499`). During microservice implementation, these must be renumbered into the `2040–2049` block shown above. The monolith code column is the actual value to use until migration.



## 12. Enums Reference

| Enum | Values | Package |
|------|--------|---------|
| `MovieStatus` | `now_showing`, `coming_soon`, `archived` | `common.enums` |
| `DayType` | `WEEKDAY`, `WEEKEND` | `common.enums` |
| `TimeSlot` | `MORNING` (06–12), `AFTERNOON` (12–18), `EVENING` (18–23), `LATE_NIGHT` (23–06) | `common.enums` |
| `RoomType` | `STANDARD`, `IMAX`, `FOUR_DX`, `GOLD_CLASS` | `common.enums` | *Values verified from RoomType.java on 2026-06-21* |
| `RoomStatus` | `ACTIVE`, `INACTIVE`, `MAINTENANCE` | `room.enums` |
| `ScreeningStatus` | `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELED` | `screening.enums` |
| `ScreeningSeatStatus` | `AVAILABLE`, `LOCKED`, `SOLD` | `screeningSeat.enums` |

---

## 13. Key Implementation Notes for Migration

1. **`startTime`/`endTime` timezone**: Monolith stores `LocalDateTime` (no timezone). In the microservice, these **must be converted to UTC `Instant`** or stored with timezone information before the `ScreeningCreated` event is published.

2. **Price is not stored on `ScreeningSeat`**: In the monolith, price is computed on-the-fly in `ScreeningSeatService.mapSeatsListToResponses()` from `PriceConfig + basePriceModifier`. In the microservice, it must be **computed once at screening creation and included in the `ScreeningCreated` event**.

3. **`HOLIDAY` DayType is not implemented**: `service-boundaries.md` mentions it but `DayType.java` only has `WEEKDAY` and `WEEKEND`. Decision needed: implement `HOLIDAY` (requires a holiday calendar source) or remove from spec.

4. **`Cinema.manager` cross-domain FK**: Replace `@OneToOne Staff manager` with `String managerId` only. Resolve manager details at query-time via Identity Service REST call.

5. **No Redis in monolith**: All Redis caching must be implemented from scratch in the Catalog Service. Recommend `@Cacheable` with Spring Cache + Redis.

6. **`ScreeningSeat` table ownership**: `screeningSeats` table is currently managed by the monolith's Catalog + Booking code together. In microservices, `ScreeningSeat` → replaced by `seat_reservation` in Booking Service; Catalog Service does not persist seat-level per-screening data.

---

## Appendix: Class Reference

| Class | Monolith Package | Role in Catalog Service |
|-------|-----------------|------------------------|
| `Movie` | `movie.entity` | Core movie entity |
| `Genre` | `movie.entity` | Movie genre |
| `AgeRating` | `movie.entity` | Age classification |
| `Cinema` | `cinema.entity` | Cinema branch |
| `Room` | `room.entity` | Screening room |
| `Seat` | `seat.entity` | Physical seat |
| `SeatType` | `seatType.entity` | Seat category + `basePriceModifier` |
| `PriceConfig` | `priceConfig.entity` | DayType × TimeSlot × SeatType → price |
| `Screening` | `screening.entity` | Scheduled screening |
| `ScreeningService` | `screening.service` | All screening CRUD + `createScreeningSeatsForRoom()` |
| `ScreeningSeatService` | `screeningSeat.service` | Price computation logic (to be migrated to `createScreening()`) |
| `ScreeningSeatMapper` | `screeningSeat.mapper` | `mapPrice()` — implements fallback to `basePriceModifier` |
| `DayType` | `common.enums` | `from(LocalDate)` → WEEKDAY/WEEKEND |
| `TimeSlot` | `common.enums` | `from(LocalTime)` → MORNING/AFTERNOON/EVENING/LATE_NIGHT |
| `MovieService` | `movie.service` | Movie CRUD + slug generation + archive guard |
| `Combo` | `combo.entity` | **[Moved from Booking]** F&B combo catalog entity |
| `ComboItem` | `combo.entity` | **[Moved from Booking]** Items within a combo (display only) |
| `ComboController` | `combo.controller` | CRUD for combos + combo items |
| `ComboService` | `combo.service` | Business logic: create/update/soft-delete combo; list active combos |

---

*Updated: 2026-06-24 | Source: direct code read of all entities, services, controllers, mappers, enums in `movie/`, `cinema/`, `room/`, `seat/`, `seatType/`, `priceConfig/`, `screening/`, `screeningSeat/`, `combo/` packages*
