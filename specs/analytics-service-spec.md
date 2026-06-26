# Analytics Service — Specification

> **Source**: Direct code read on 2026-06-21.
> **Monolith package**: `revenue/` (this is the only analytics implementation found — named "revenue" in code).
> **Port**: 8086
> **Database**: PostgreSQL (per-service schema)
> **Input (Monolith)**: Synchronous calls from `PaymentServiceImpl` / `InvoiceServiceImpl` — no Kafka.
> **Input (Microservice target)**: Kafka events (`PaymentConfirmed`, `BookingPaid`, `InvoiceRefunded`).
> **Output**: Read-only query endpoints; no outbound service calls.

---

## 1. Service Overview

The Analytics Service is responsible for **real-time revenue aggregation and report generation**. It maintains three pre-aggregated tables (`daily_revenue_summary`, `movie_revenue`, `revenue_reports`) that are updated incrementally on every successful payment and rolled back on refund.

**In the monolith**: `RevenueAggregationService` is called **synchronously and directly** inside `PaymentServiceImpl` and `InvoiceServiceImpl`:

```java
// PaymentServiceImpl (after VNPay IPN success or cash payment)
revenueAggregationService.processPaymentForRevenue(payment);

// InvoiceServiceImpl (on refund)
revenueAggregationService.processInvoiceRefundForRevenue(invoiceId);
```

**In the microservice**: These sync calls must be replaced by Kafka event consumption:
- `PaymentConfirmed` → `processPaymentForRevenue()`
- `InvoiceRefunded` → `processInvoiceRefundForRevenue()`

**Key design principle**: Revenue aggregation is **idempotent**. The `revenue_processing_log` table (unique index on `paymentId`) prevents double-counting regardless of how many times the same payment event is received.

---

## 2. Domain Model

### 2.1 Entity Graph

```
Payment (cross-domain, stored as paymentId String)
    │ triggers
    ▼
RevenueProcessingLog  ← idempotency guard (UNIQUE paymentId)
    │
    ├── DailyRevenueSummary (PK: cinemaId + reportDate — no DB unique constraint, enforced in code)
    └── MovieRevenue        (PK: movieId + cinemaId + reportDate — no DB unique constraint, enforced in code)

RevenueReport  ← manually generated snapshot (aggregates DailyRevenueSummary)
```

---

### 2.2 Entity Definitions

#### DailyRevenueSummary

**Table**: `daily_revenue_summary`
**No soft-delete** (not extends BaseEntity — plain entity).
**Logical unique key**: `(cinemaId, reportDate)` — enforced by code, NOT by DB constraint.

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK, `@GeneratedValue(UUID)` | |
| `cinemaId` | `String` | `cinema_id` | NOT NULL | Cross-domain ref (no FK) |
| `reportDate` | `LocalDate` | `report_date` | NOT NULL | Payment date (not screening date) |
| `ticketRevenue` | `BigDecimal` | `ticket_revenue` | NOT NULL, `precision=12, scale=2` | `booking.totalAmount - comboRevenue` |
| `comboRevenue` | `BigDecimal` | `combo_revenue` | NOT NULL, `precision=12, scale=2` | Sum of `bookingCombo.subtotal` |
| `netRevenue` | `BigDecimal` | `net_revenue` | NOT NULL, `precision=12, scale=2` | `ticketRevenue + comboRevenue` |
| `totalTransactions` | `Integer` | `total_transactions` | NOT NULL | Count of payments processed (bookings) |

**Initialization**: A zero-value row is created for **every cinema** each midnight via scheduled job AND on application startup. This guarantees the dashboard always has a row for today even with zero revenue.

---

#### MovieRevenue

**Table**: `movie_revenue`
**No soft-delete**.
**Logical unique key**: `(movieId, cinemaId, reportDate)` — enforced by code.

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK, `@GeneratedValue(UUID)` | |
| `movieId` | `String` | `movie_id` | NOT NULL | Cross-domain ref |
| `cinemaId` | `String` | `cinema_id` | NOT NULL | Cross-domain ref |
| `reportDate` | `LocalDate` | `report_date` | NOT NULL | Payment date |
| `totalTicketsSold` | `Integer` | `total_tickets_sold` | NOT NULL | Count of `screeningSeats` for the booking |
| `totalRevenue` | `BigDecimal` | `total_revenue` | NOT NULL, `precision=12, scale=2` | Ticket revenue only (excludes combos) |

**Initialization**: A zero-value row is created for **every `(movie, cinema)` cross product** each midnight and on startup.

> ⚠️ **N×M initialization problem**: If there are 100 movies and 10 cinemas, midnight job creates 1,000 new rows per day. This scales poorly. In the microservice, initialization should be lazy (create row on first event for that `movie+cinema+date`).

---

#### RevenueReport

**Table**: `revenue_reports`
**No soft-delete**.
**Logical unique key**: `(cinemaId, reportType, startDate, endDate)` — enforced by code (upsert pattern).

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK, `@GeneratedValue(UUID)` | |
| `cinemaId` | `String` | `cinema_id` | NOT NULL | Cinema scope; `"ALL"` for cross-cinema reports |
| `reportType` | `ReportType` | `report_type` | NOT NULL | `DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM` |
| `startDate` | `LocalDate` | `start_date` | NOT NULL | Inclusive |
| `endDate` | `LocalDate` | `end_date` | NOT NULL | Inclusive |
| `totalTicketRevenue` | `BigDecimal` | `total_ticket_revenue` | NOT NULL, `precision=12, scale=2` | Sum of daily ticket revenue in range |
| `totalComboRevenue` | `BigDecimal` | `total_combo_revenue` | NOT NULL, `precision=12, scale=2` | Sum of daily combo revenue in range |
| `netRevenue` | `BigDecimal` | `net_revenue` | NOT NULL, `precision=12, scale=2` | Sum of daily net revenue in range |
| `generatedAt` | `LocalDateTime` | `generated_at` | NOT NULL | Timestamp of last generation |

**NOT a live view** — it's a snapshot that becomes stale until `POST /revenue/reports/generate` is called again.

---

#### RevenueProcessingLog

**Table**: `revenue_processing_log`
**Unique index**: `idx_payment_id` on `paymentId`.

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK, `@GeneratedValue(UUID)` | |
| `paymentId` | `String` | `paymentId` | NOT NULL, UNIQUE | Guard for idempotency |
| `paymentStatus` | `String` | `paymentStatus` | NOT NULL | `"SUCCESS"` or `"REFUNDED"` |
| `processedAt` | `LocalDateTime` | `processedAt` | NOT NULL | When this event was processed |
| `errorMessage` | `String` | `errorMessage` | nullable | If processing failed, the error is logged but the log record is still saved |

**Both success and error cases** create a log entry. The unique constraint on `paymentId` means even a failed-then-retried scenario won't double-count (the first failed attempt creates the log; subsequent retries skip due to `existsByPaymentId`).

> ⚠️ **Bug**: If processing fails (exception thrown), the error log entry is saved, but then the exception is re-thrown causing transaction rollback — which also rolls back the error log. Net result: on failure, NO log record is saved, so a retry WILL re-attempt (which is the desired behavior). However, this means `errorMessage` is never persisted in the current code.

---

## 3. Revenue Aggregation Logic

### 3.1 On PaymentConfirmed (`processPaymentForRevenue`)

**Trigger (monolith)**: Called directly by `PaymentServiceImpl` after VNPay IPN success or cash payment confirmation.
**Trigger (microservice)**: Consume `PaymentConfirmed` Kafka event from topic `cinema.payment.payment-confirmed`.

#### Step-by-step algorithm

```
1. IDEMPOTENCY CHECK
   if processingLogRepository.existsByPaymentId(payment.getId()):
       log.info("Already processed, skipping")
       return

2. RESOLVE CROSS-DOMAIN REFS (from monolith shared DB; in microservice: from event payload)
   invoice = invoiceRepository.findById(payment.invoiceId)
   booking = bookingRepository.findById(invoice.bookingId)
   screening = booking.screening
   cinemaId = screening.room.cinema.id
   movieId = screening.movie.id

3. DETERMINE reportDate
   reportDate = payment.paymentDate.toLocalDate()   // payment date, NOT screening date
   if payment.paymentDate == null: reportDate = LocalDate.now()

4. COUNT TICKETS SOLD
   ticketsSold = screeningSeatRepository.findByBooking(bookingId).size()
   // = number of screeningSeats linked to this booking (before SeatReservation refactor)

5. CALCULATE REVENUE SPLIT
   combos = bookingComboRepository.findByBookingId(bookingId)
   comboRevenue = sum(combo.subtotal)
   ticketRevenue = booking.totalAmount - comboRevenue

6. DETERMINE SIGN (SUCCESS vs REFUND)
   if payment.status == REFUNDED:
       ticketMultiplier = -1
       revenueMultiplier = -1
   else:
       ticketMultiplier = 1
       revenueMultiplier = 1

7. UPSERT DailyRevenueSummary (cinemaId + reportDate)
   existing = findByCinemaIdAndReportDate(cinemaId, reportDate)
   if existing:
       summary.ticketRevenue += ticketRevenue * multiplier
       summary.comboRevenue  += comboRevenue  * multiplier
       summary.netRevenue     = summary.ticketRevenue + summary.comboRevenue  // recalculated
       summary.totalTransactions += 1 * ticketMultiplier
   else:
       INSERT new row with initial values

8. UPSERT MovieRevenue (movieId + cinemaId + reportDate)
   existing = findByMovieIdAndCinemaIdAndReportDate(movieId, cinemaId, reportDate)
   if existing:
       revenue.totalRevenue      += ticketRevenue * multiplier  // combo NOT included in MovieRevenue
       revenue.totalTicketsSold  += ticketsSold * ticketMultiplier
   else:
       INSERT new row with initial values

9. SAVE ProcessingLog
   processingLogRepository.save(
       RevenueProcessingLog {
           paymentId = payment.id,
           paymentStatus = payment.status.name(),
           processedAt = now()
       }
   )
```

**Key observations**:
- `reportDate` = **payment date** (when money was received), NOT booking date, NOT screening date.
- `MovieRevenue.totalRevenue` = **ticket revenue only** (combos excluded). `DailyRevenueSummary` tracks both separately.
- `netRevenue` in `DailyRevenueSummary` = `ticketRevenue + comboRevenue` (recalculated after each upsert).

---

### 3.2 On InvoiceRefunded (`processInvoiceRefundForRevenue`)

**Trigger (monolith)**: Called directly by `InvoiceServiceImpl.updateInvoiceStatus()`.
**Trigger (microservice)**: Consume `InvoiceRefunded` Kafka event.

**Difference from `processPaymentForRevenue`**: The refund path does **not** use the idempotency log. There is no `existsByPaymentId` check and no new `RevenueProcessingLog` entry created. This means refund can be double-applied if the endpoint is called twice.

#### Step-by-step algorithm

```
1. Resolve invoice → booking → screening → cinemaId + movieId

2. Find original payment date:
   payments = paymentRepository.findByInvoiceId(invoiceId)
   successPayment = payments.filter(type=BOOKING, status=SUCCESS).first()
   reportDate = successPayment.paymentDate.toLocalDate()
   // IMPORTANT: subtracts from the SAME date as the original payment

3. Count tickets and calculate revenue split (same as §3.1 steps 4-5)

4. Apply negative multipliers (always -1 for refund)

5. Upsert DailyRevenueSummary with negative delta

6. Upsert MovieRevenue with negative delta

7. No ProcessingLog entry — NO idempotency guard
```

> ⚠️ **Bug**: `processInvoiceRefundForRevenue` has no idempotency check. Calling `PATCH /invoices/{id}/status?status=REFUNDED` twice would subtract revenue twice. In the microservice, the `InvoiceRefunded` Kafka event should be idempotency-checked using a separate log entry or by checking `invoice.status == REFUNDED` before publishing.

---

### 3.3 Reprocess Endpoint (`POST /revenue/reprocess`)

**Purpose**: Full rebuild of all aggregated revenue data from raw payment records. Used when `daily_revenue_summary` and `movie_revenue` data is found to be inconsistent or after a data migration.

**Input**: No body — reprocesses **ALL** data.

**Algorithm**:
```
1. Find all Payments with status = SUCCESS
   → for each: call processPaymentForRevenue(payment)
   → processPaymentForRevenue() skips if processingLogRepository.existsByPaymentId() = true
   → So only truly un-processed payments get aggregated

2. Find all Invoices with status = REFUNDED
   → for each: call processInvoiceRefundForRevenue(invoice.id)
   → No idempotency check on refunds — potential double-subtract (see §3.2 bug)
```

**Double-counting prevention**:
- **Payments**: Fully protected by `revenue_processing_log` UNIQUE constraint on `paymentId`.
- **Refunds**: NOT protected — calling reprocess twice will double-subtract refunded amounts.

**No date range filter** — the monolith's reprocess endpoint always reprocesses everything. In the microservice, add `?from=&to=` query params.

**Authorization**: `@PreAuthorize` is **commented out** (`// temporarily disabled for testing`). In production this endpoint MUST be secured to `ADMIN` only.

---

## 4. Daily Initialization (`DailyRevenueInitializerService`)

### 4.1 Midnight Cron (`0 0 0 * * *`)

Every night at midnight, zero-value rows are created for:
- Every `cinema` → one `DailyRevenueSummary` row for today
- Every `(cinema, movie)` cross product → one `MovieRevenue` row for today

**Purpose**: Ensure dashboard queries always return a row for today even if no transactions occurred. Prevents `null` gaps in time-series charts.

### 4.2 On Application Startup (`@EventListener(ApplicationReadyEvent)`)

Same logic as midnight cron, but runs once on startup to handle the case where the app was restarted after midnight before the cron fires.

**Guard**: Checks if any cinema already has a `DailyRevenueSummary` for today. If yes, skips all initialization. If no, initializes all cinemas.

---

## 5. Report Generation Logic

### 5.1 `POST /revenue/reports/generate` (Live Query → Snapshot)

**What it does**: Reads from `daily_revenue_summary`, aggregates by SUM for the requested date range, and saves/updates a `RevenueReport` snapshot.

**For a specific cinema**:
```sql
SELECT SUM(ticket_revenue), SUM(combo_revenue), SUM(net_revenue)
FROM daily_revenue_summary
WHERE cinema_id = :cinemaId
  AND report_date BETWEEN :startDate AND :endDate
```
→ Upsert into `revenue_reports` (update if same `cinemaId+reportType+startDate+endDate` exists).

**For all cinemas** (`cinemaId` is null/empty):
- Iterates all cinemas from `cinemaService.getCinemas()`
- Generates one `RevenueReport` per cinema (upsert per cinema)
- Returns a placeholder response with `cinemaId = "ALL"` (the individual per-cinema reports ARE saved, but the aggregate across all is NOT saved as a single row)

> **Note**: `generateForAllCinemas()` loops over all cinemas and calls the same upsert logic. It makes **N + 1 queries** (1 to list cinemas, N to get daily summaries). In the microservice, replace with a single GROUP BY cinema query.

---

## 6. API Endpoints

### 6.1 Report Endpoints (`/revenue`)

All endpoints use `ResponseEntity<T>` directly (not wrapped in `ApiResponse<T>` — different from other services). No access control in current code (auth `@PreAuthorize` is missing from `RevenueController`).

---

#### `GET /revenue/reports`

**Purpose**: Query pre-generated `RevenueReport` snapshots.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `cinemaId` | `String` | optional | Filter by cinema ID; null = all cinemas |
| `reportType` | `ReportType` | optional | `DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM` |
| `from` | `LocalDate` | optional | Filter by `startDate >= from` (ISO date: `yyyy-MM-dd`) |
| `to` | `LocalDate` | optional | Filter by `endDate <= to` |

**Aggregation**: No aggregation — returns raw stored `RevenueReport` rows, ordered by `generatedAt DESC`.

**Response** (list):
```json
[
  {
    "id":                 "uuid",
    "cinemaId":           "cinema-uuid",
    "reportType":         "MONTHLY",
    "startDate":          "2026-06-01",
    "endDate":            "2026-06-30",
    "totalTicketRevenue": 18900000.00,
    "totalComboRevenue":  3150000.00,
    "netRevenue":         22050000.00,
    "generatedAt":        "2026-06-21T07:00:00"
  }
]
```

---

#### `POST /revenue/reports` (Manual create)

**Purpose**: Manually insert a pre-computed `RevenueReport` (no re-aggregation — caller provides all values). Used for seeding or external imports.

**Request body**:
```json
{
  "cinemaId":           "cinema-uuid",       // required
  "reportType":         "MONTHLY",           // required
  "startDate":          "2026-06-01",        // required
  "endDate":            "2026-06-30",        // required
  "totalTicketRevenue": 18900000.00,         // required
  "totalComboRevenue":  3150000.00,          // required
  "netRevenue":         22050000.00          // required
}
```

---

#### `POST /revenue/reports/generate` (Live generate + save)

**Purpose**: Aggregate from `daily_revenue_summary` for the given date range → save as `RevenueReport` snapshot.

**Request body**:
```json
{
  "cinemaId":   "cinema-uuid",   // optional; null = generate for ALL cinemas
  "reportType": "MONTHLY",       // required; one of DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM
  "startDate":  "2026-06-01",    // required
  "endDate":    "2026-06-30"     // required
}
```

**Validation**:
- For `CUSTOM` type: `startDate` and `endDate` must not be null, `endDate >= startDate`.
- For all other types: same validation but the comment in code says "frontend calculates the dates".

**Response**: Same `RevenueReportResponse` as above. If `cinemaId` is null, returns a placeholder `{ cinemaId: "ALL", ... }` with null revenue totals.

---

#### `GET /revenue/daily`

**Purpose**: Raw `daily_revenue_summary` rows for a date range.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `cinemaId` | `String` | optional | Null = all cinemas |
| `from` | `LocalDate` | optional | `reportDate >= from` |
| `to` | `LocalDate` | optional | `reportDate <= to` |

**Sorted**: `reportDate DESC`.

**Response** (list):
```json
[
  {
    "id":                "uuid",
    "cinemaId":          "cinema-uuid",
    "reportDate":        "2026-06-21",
    "ticketRevenue":     270000.00,
    "comboRevenue":      45000.00,
    "netRevenue":        315000.00,
    "totalTransactions": 3
  }
]
```

---

#### `POST /revenue/daily` (Manual create)

Insert a `DailyRevenueSummary` row directly. Validates `reportDate` is not null. No duplicate check beyond code.

---

#### `GET /revenue/movie`

**Purpose**: Per-movie revenue, optionally filtered.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `cinemaId` | `String` | optional | Null = all cinemas |
| `movieId` | `String` | optional | Null = all movies |
| `from` | `LocalDate` | optional | `reportDate >= from` |
| `to` | `LocalDate` | optional | `reportDate <= to` |

**Sorted**: `reportDate DESC`.

**Response** (list):
```json
[
  {
    "id":              "uuid",
    "movieId":         "movie-uuid",
    "cinemaId":        "cinema-uuid",
    "reportDate":      "2026-06-21",
    "totalTicketsSold": 6,
    "totalRevenue":    270000.00
  }
]
```

> **Note**: `totalRevenue` here is **ticket revenue only** (combo excluded). `DailyRevenueSummary` has the full picture including combos.

---

#### `POST /revenue/reprocess`

**Purpose**: Rebuild all revenue aggregation from raw payments.

**Input**: No body, no params — reprocesses ALL historical data.

**Authorization**: **ADMIN only** (`hasRole('ADMIN')`).

> ⚠️ **Security fix**: In the monolith, `@PreAuthorize` is **commented out** on this endpoint (`// temporarily disabled for testing`). In the microservice implementation, this **MUST be re-enabled**:
> ```java
> @PreAuthorize("hasRole('ADMIN')")
> @PostMapping("/revenue/reprocess")
> public ResponseEntity<...> reprocess() { ... }
> ```
> Without this, any authenticated user can trigger a full data rebuild, causing significant load on the analytics DB.

**Response**:
```json
{
  "code": 1000,
  "message": null,
  "result": "Revenue reprocessing completed successfully"
}
```

On error: HTTP 500 + `{ message: "Error during reprocessing: <message>" }`

---

## 7. Kafka Event Contracts (Microservice Target)

### 7.1 Events Consumed

#### `PaymentConfirmed`
- **Topic**: `cinema.payment.payment-confirmed`
- **Action**: Record payment fact as idempotency anchor in `revenue_processing_log` (does NOT upsert revenue tables — see BookingPaid below)
- **Required payload fields**:

| Field in Event | Used For |
|---------------|----------|
| `paymentId` | Idempotency key in `revenue_processing_log` |
| `bookingId` | Correlation key: link to `BookingPaid` event |
| `amountPaid` | Stored on the processing log for audit |
| `paidAt` | Stored on the processing log |

> **Note**: `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold` are **NOT** in `PaymentConfirmed`. They arrive via the `BookingPaid` event. Analytics must consume both events and correlate by `bookingId`.

#### `BookingPaid`
- **Topic**: `cinema.booking.booking-paid`
- **Publisher**: Booking Service
- **Action**: `processRevenueFromBookingPaid()` — upsert `daily_revenue_summary` and `movie_revenue`
- **Idempotency**: Skip if `revenue_processing_log` already has an entry for this `bookingId` with `paymentStatus = SUCCESS`
- **Required payload fields**:

| Field in Event | Maps To | Used For |
|---------------|---------|----------|
| `bookingId` | — | Idempotency check key in `revenue_processing_log` |
| `paymentId` | — | Stored on processing log (echoed from PaymentConfirmed) |
| `cinemaId` | `daily_revenue_summary.cinema_id` | DailyRevenueSummary key |
| `movieId` | `movie_revenue.movie_id` | MovieRevenue key |
| `screeningDate` | `daily_revenue_summary.report_date` | Revenue date bucket (screening date, NOT payment date) |
| `ticketRevenue` | `daily_revenue_summary.ticket_revenue` | Revenue split |
| `comboRevenue` | `daily_revenue_summary.combo_revenue` | Revenue split |
| `totalTicketsSold` | `movie_revenue.total_tickets_sold` | MovieRevenue count |
| `paidAt` | `revenue_processing_log.processedAt` | Audit |

#### `InvoiceRefunded`
- **Topic**: `cinema.payment.invoice-refunded`
- **Action**: `processInvoiceRefundForRevenue()`
- **Required payload fields**:

| Field in Event | Maps To | Used For |
|---------------|---------|---------|
| `invoiceId` | — | Idempotency key: `invoiceId + "REFUND"` |
| `bookingId` | — | Locate original `revenue_processing_log` entry |
| `refundAmount` | Negative delta | Subtract from revenue tables |
| `originalPaymentDate` | `daily_revenue_summary.report_date` | Subtract from the CORRECT date bucket |

> **Idempotency fix**: `processInvoiceRefundForRevenue` now must check `revenue_processing_log` for an entry with key `invoiceId + "-REFUND"` before applying. If found, skip. This fixes the double-refund bug documented in §3.2.

---

## 8. Read-only Catalog Data

**Current monolith behavior**: The Analytics/Revenue Service does **NOT call the Catalog Service** for data enrichment. Responses return raw `movieId` and `cinemaId` strings only — no movie titles or cinema names are included in any response.

**`RevenueReportService` does call `CinemaService`**, but only to get a list of `cinemaId`s for the "generate for all cinemas" loop:
```java
List<String> cinemaIds = cinemaService.getCinemas().stream()
    .map(cinema -> cinema.getId())
    .toList();
```

This is a cross-domain call within the monolith (shared Spring bean). In the microservice:

> **Q14 Decision**: Analytics Service calls `GET /cinemas` on **Catalog Service via synchronous REST** (Feign Client) when generating reports.
> This is simpler than event-sourcing a local `cinemas` replica table — appropriate for thesis scope.
> If Catalog Service is unavailable, report generation fails gracefully with error `6001: CATALOG_SERVICE_UNAVAILABLE`.

#### Feign Client contract

```java
@FeignClient(name = "catalog-service")
public interface CatalogServiceClient {
    @GetMapping("/cinemas")
    List<CinemaDto> getAllCinemas();
}
```

- Called by: `RevenueReportService.generateForAllCinemas()` and `RevenueReportService.generateDailySummary()`
- **Failure behavior**: If the Feign call throws `FeignException`, catch it, log the error, and throw `AppException(ErrorCode.CATALOG_SERVICE_UNAVAILABLE)` (code `6001`, HTTP 503)
- **No caching** on this call — cinema list is fetched fresh on each report generation trigger

**Frontend enrichment**: The frontend is expected to resolve `movieId`/`cinemaId` to display names by calling the Catalog Service independently or by joining response data client-side. The Analytics Service does **not** enrich report data with names.

---

## 9. Data Ownership

| Table | Notes |
|-------|-------|
| `daily_revenue_summary` | Updated incrementally per payment; initialized to zero each midnight per cinema |
| `movie_revenue` | Updated incrementally per payment; initialized to zero each midnight per `(movie, cinema)` |
| `revenue_reports` | Snapshot table; updated on demand via `POST /revenue/reports/generate` |
| `revenue_processing_log` | Idempotency log; one record per processed paymentId (UNIQUE constraint) |

---

## 10. Enums Reference

| Enum | Values | Notes |
|------|--------|-------|
| `ReportType` | `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`, `CUSTOM` | Used in `RevenueReport.reportType` and filter params |

---

## 11. Key Implementation Notes for Migration

1. **Cross-domain joins in aggregation must be eliminated**: `RevenueAggregationService` currently resolves `Invoice → Booking → Screening → Cinema/Movie` via shared JPA repositories. In the microservice, the `PaymentConfirmed` event must carry `cinemaId`, `movieId`, `ticketRevenue`, `comboRevenue`, `totalTicketsSold`, `paidAt` directly.

2. **`revenue_processing_log` is the idempotency backbone**: Always check `existsByPaymentId` before processing. The UNIQUE DB constraint is a backup safety net. Keep this pattern in the microservice.

3. **Refund idempotency gap**: `processInvoiceRefundForRevenue` has no idempotency guard. Add a log entry keyed on `invoiceId + "REFUND"` or on the `InvoiceRefunded` event ID.

4. **N×M midnight initialization is a scalability risk**: 100 movies × 10 cinemas = 1,000 inserts per night. In the microservice, switch to lazy initialization: create the row only when the first payment for that `(movie, cinema, date)` arrives.

5. **`POST /revenue/reprocess` must be secured**: The `@PreAuthorize` is commented out. Re-enable before any production deployment.

6. **`RevenueReport` is a manually-triggered snapshot**: It does NOT auto-update when new payments arrive. The dashboard must either query `/revenue/daily` directly or call `POST /revenue/reports/generate` to refresh snapshots.

7. **`generateForAllCinemas` returns a dummy response**: When `cinemaId` is null, the per-cinema `RevenueReport` rows ARE saved, but the function returns `{ cinemaId: "ALL", totalTicketRevenue: null, ... }`. The frontend cannot use this return value for display — it must re-query `GET /revenue/reports` to get individual cinema reports.

8. **No `ApiResponse<T>` wrapper on revenue endpoints**: `RevenueController` returns `ResponseEntity<T>` directly, not `ApiResponse<T>`. This is inconsistent with all other services. Standardize in the microservice.

9. **`CinemaService` dependency for "all cinemas" generate**: In the microservice, replace with a local `cinemas` read-replica table consumed from `CinemaCreated`/`CinemaUpdated` Kafka events. Do not call the Catalog Service synchronously from the Analytics Service.

---

## Appendix: Class Reference

| Class | Package | Role |
|-------|---------|------|
| `DailyRevenueSummary` | `revenue.entity` | Per-day per-cinema revenue aggregation row |
| `MovieRevenue` | `revenue.entity` | Per-day per-movie per-cinema revenue row |
| `RevenueReport` | `revenue.entity` | Pre-generated report snapshot |
| `RevenueProcessingLog` | `revenue.entity` | Idempotency log (UNIQUE paymentId) |
| `ReportType` | `revenue.enums` | `DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM` |
| `RevenueAggregationService` | `revenue.service` | Core aggregation: `processPaymentForRevenue()`, `processInvoiceRefundForRevenue()`, upsert logic |
| `RevenueReportService` | `revenue.service` | Report CRUD + `generate()` (aggregate `DailyRevenueSummary` → `RevenueReport`) |
| `DailyRevenueService` | `revenue.service` | CRUD for `DailyRevenueSummary` |
| `MovieRevenueService` | `revenue.service` | CRUD for `MovieRevenue` |
| `RevenueReprocessService` | `revenue.service` | Full reprocess: iterate all SUCCESS payments + REFUNDED invoices |
| `DailyRevenueInitializerService` | `revenue.service` | Midnight cron + startup: zero-fill today's rows for all cinemas/movies |
| `RevenueController` | `revenue.controller` | `/revenue/reports`, `/revenue/daily`, `/revenue/movie` |
| `RevenueReprocessController` | `revenue.controller` | `POST /revenue/reprocess` |

---

*Updated: 2026-06-21 | Source: direct code read of all entities, services, repositories, controllers in `revenue/` package.*
