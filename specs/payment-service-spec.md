# Payment Service — Specification

> **Source**: Direct code read on 2026-06-21.
> **Port**: 8084
> **Database**: PostgreSQL (per-service schema)
> **Message Broker**: Kafka (consume `BookingCreated`, `BookingCancelled`; publish `PaymentConfirmed`, `PaymentFailed`, `InvoiceRefunded`)

---

## 1. Service Overview

The Payment Service manages the financial lifecycle of a booking:
- **Invoice**: Created once per booking. `1 Invoice : N Payment` attempts.
- **Payment**: Each payment attempt (VNPay, Cash) produces one `Payment` record. Multiple attempts allowed (e.g. user abandons VNPay flow and retries).
- **PaymentMethod**: A configurable catalog of available payment providers (`VNPay`, `Cash`).
- **VNPay Integration**: The only external payment gateway currently used. Communicates via redirect URL + two server-to-server callbacks (Return, IPN).

**In the monolith**, `InvoiceService` directly calls `BookingService.confirmBookingPayment()` and `BookingService.refundBooking()`. In the microservice, these synchronous calls must be replaced by publishing `PaymentConfirmed` and `PaymentFailed` Kafka events.

---

## 2. Domain Model

### 2.1 Entity Graph

```
Booking (cross-domain, stored as bookingId String)
    │ 1:1
    ▼
Invoice ──────────────────────────────────────────┐
    │ 1:N                                         │
    ▼                                             │
Payment ──── PaymentMethod                        │
(1 per attempt; e.g. VNPay,Cash)                 │
                                    InvoiceStatus: PENDING → PAID / FAILED / REFUNDED
```

---

### 2.2 Entity Definitions

#### Invoice

**Table**: `invoices`

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK, `@GeneratedValue(UUID)` | |
| `bookingId` | `String` | `booking_id` | NOT NULL, UNIQUE | One invoice per booking; no FK constraint (cross-domain) |
| `customerId` | `String` | `customer_id` | nullable | Stored from `BookingCreated` event; cross-domain ref, no FK |
| `customerEmail` | `String` | `customer_email` | nullable | Stored from `BookingCreated` event; used in payment notification events without cross-service calls |
| `totalAmount` | `BigDecimal` | `total_amount` | NOT NULL, `precision=10, scale=2` | Copied from `booking.totalAmount` at invoice creation |
| `status` | `InvoiceStatus` | `status` | NOT NULL | `PENDING` / `PAID` / `FAILED` / `REFUNDED` |
| `createdAt` | `LocalDateTime` | `created_at` | NOT NULL, `@CreationTimestamp`, not updatable | |
| `paidAt` | `LocalDateTime` | `paid_at` | nullable | Set when `status = PAID` |

**One-invoice-per-booking**: Enforced by `UNIQUE` constraint on `booking_id`. `createInvoice()` checks `invoiceRepository.findByBookingId()` before creating.

> **BR-PAY-001**: `customerEmail` MUST be persisted on `Invoice` at creation time (extracted from the `BookingCreated` event payload). This enables `PaymentConfirmed`, `PaymentFailed`, and `InvoiceRefunded` Kafka events to carry `customerEmail` without requiring a cross-service call to the Identity Service at publish time.

---

#### Payment

**Table**: `payments`

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK, `@GeneratedValue(UUID)` | |
| `invoiceId` | `String` | `invoice_id` | NOT NULL | FK → `invoices.id` |
| `paymentMethodId` | `String` | `payment_method_id` | NOT NULL | FK → `payment_methods.id` |
| `amount` | `BigDecimal` | `amount` | NOT NULL, `precision=10, scale=2` | VND amount |
| `paymentType` | `PaymentType` | `payment_type` | NOT NULL | `BOOKING` or `REFUND` |
| `transactionCode` | `String` | `transaction_code` | UNIQUE (nullable) | VNPay: 12-digit random number; Cash: `"CASH" + 10-digit` |
| `status` | `PaymentStatus` | `status` | NOT NULL | `PENDING` / `SUCCESS` / `FAILED` / `CANCELLED` / `REFUNDED` |
| `description` | `String` | `description` | nullable | Free text |
| `paymentDate` | `LocalDateTime` | `payment_date` | nullable | Set when payment completes |
| `createdAt` | `LocalDateTime` | `created_at` | NOT NULL, `@CreationTimestamp` | |

**`transactionCode` uniqueness**: DB `UNIQUE` constraint. `VNPayUtil.getRandomNumber(12)` generates a 12-digit numeric string. Collision risk is low but not explicitly retried — the DB constraint would throw if collision occurs.

---

#### PaymentMethod

**Table**: `payment_methods`

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK, `@GeneratedValue(UUID)` | |
| `name` | `String` | `name` | NOT NULL, UNIQUE | e.g. `"VNPay"`, `"Cash"` |
| `description` | `String` | `description` | TEXT | |
| `isActive` | `Boolean` | `is_active` | NOT NULL | Whether this method is available |
| `createdAt` | `LocalDateTime` | `created_at` | NOT NULL | |

---

## 3. Status Lifecycles

### 3.1 InvoiceStatus

```
PENDING ──── VNPay/Cash payment SUCCESS ──► PAID
PENDING ──── VNPay failed / expired ──────► FAILED   (retryable — new Payment attempt can be made)
PAID    ──── Admin manual PATCH + refund ──► REFUNDED
```

### 3.2 PaymentStatus

```
PENDING ──── VNPay responseCode == "00" ──► SUCCESS
PENDING ──── VNPay responseCode != "00" ──► FAILED
(Cash payment is created directly as SUCCESS — no PENDING state)
```

### 3.3 Invoice → Payment Multiplicity

One `Invoice` can have **multiple `Payment` records**:
1. User initiates VNPay → `Payment#1 (PENDING)` created
2. User abandons / VNPay times out → `Payment#1 → FAILED`
3. User retries via VNPay → `Payment#2 (PENDING)` created
4. VNPay confirms → `Payment#2 → SUCCESS` + `Invoice → PAID`

Guard: `createVNPayPayment()` checks `invoice.status == PAID` and throws `INVOICE_ALREADY_PAID` if already settled.

**Idempotency in IPN**: `handleVNPayIPN()` checks `payment.status != PENDING` and returns `RspCode=02 "Payment already processed"` to prevent double-processing.

---

## 4. VNPay Integration Spec

### 4.1 Configuration

`application.yml` binds to `VNPayConfig` class (`@ConfigurationProperties(prefix = "vnpay")`):

| YML Key | `VNPayConfig` Field | Description | Example / Notes |
|---------|---------------------|-------------|-----------------|
| `vnpay.tmn-code` | `tmnCode` | Terminal merchant code | `${VNPAY_TMN_CODE}` — from env var |
| `vnpay.hash-secret` | `hashSecret` | **HMAC-SHA512 signing key** | `${VNPAY_HASH_SECRET}` — [SECRET] |
| `vnpay.url` | `url` | VNPay gateway URL | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `vnpay.return-url` | `returnUrl` | Frontend redirect after payment | `${VNPAY_RETURN_URL}` |
| `vnpay.ipn-url` | `ipnUrl` | Server-to-server notification URL | `${VNPAY_IPN_URL}` |
| `vnpay.version` | `version` | API version | `2.1.0` |
| `vnpay.command` | `command` | Payment command | `pay` |
| `vnpay.order-type` | `orderType` | Order type category | `other` |

---

### 4.2 Create Payment URL (`POST /payment/vnpay/{invoiceId}`)

#### Input

```
invoiceId: String (path variable)
returnUrl: String (optional query param — overrides config returnUrl for dev flexibility)
HttpServletRequest: used to extract client IP via X-FORWARDED-FOR or remoteAddr
```

#### Algorithm

1. **Load invoice** → `INVOICE_NOT_EXISTED` if not found
2. **Guard**: if `invoice.status == PAID` → `INVOICE_ALREADY_PAID`
3. **Generate `txnRef`**: `VNPayUtil.getRandomNumber(12)` — 12-digit numeric string (random, not UUID)
4. **Generate `orderInfo`**: `"INV" + last 8 chars of invoiceId (dashes removed)` — e.g. `"INV3FA85F64"`
5. **Find `VNPay` payment method** from DB → `PAYMENT_METHOD_NOT_EXISTED` if not seeded
6. **Persist `Payment`**: `status=PENDING`, `transactionCode=txnRef`, `paymentType=BOOKING`
7. **Build VNPay params** as `TreeMap<String, String>` (sorted ascending by key):

| VNPay Param | Value |
|-------------|-------|
| `vnp_Version` | `2.1.0` |
| `vnp_Command` | `pay` |
| `vnp_TmnCode` | `[tmnCode from config]` |
| `vnp_Amount` | `invoice.totalAmount × 100` (VNPay expects amount in lowest currency unit × 100) |
| `vnp_CurrCode` | `VND` |
| `vnp_TxnRef` | `txnRef` (12-digit numeric) |
| `vnp_OrderInfo` | `"INV" + last8charsOfInvoiceId` |
| `vnp_OrderType` | `other` |
| `vnp_Locale` | `vn` |
| `vnp_ReturnUrl` | `returnUrlOverride` OR `config.returnUrl` |
| `vnp_IpAddr` | Client IP from `X-FORWARDED-FOR` (first IP if comma-list) or `remoteAddr`; IPv6 loopback normalized to `127.0.0.1` |
| `vnp_CreateDate` | `yyyyMMddHHmmss` formatted in **`Etc/GMT+7`** timezone (= UTC+7 = Vietnam local time) |

8. **Compute SecureHash**:
   ```
   hashData = hashAllFields(params)
   // For each param (sorted ascending), URL-encode key and value:
   //   "vnp_Amount=27000000&vnp_Command=pay&..."
   //   (spaces encoded as %20, not +)
   
   vnp_SecureHash = HMAC-SHA512(hashSecret, hashData) → uppercase hex
   ```

9. **Build payment URL**:
   ```
   queryUrl = getPaymentURL(params, false)  // URL-encoded sorted params (without SecureHash)
   paymentUrl = config.url + "?" + queryUrl + "&vnp_SecureHash=" + vnp_SecureHash
   ```

10. **Return** `PaymentDetailsResponse { code: "00", message: "Success", paymentUrl, id, transactionCode, invoiceId, amount, status: "PENDING" }`

#### Important Notes
- `vnp_Amount` = `totalAmount × 100` (e.g. 270,000 VND → `27000000`)
- **The SecureHash is appended to the URL as a query param AFTER the sorted params, NOT included in the hash data**
- For hash construction on request: params are **URL-encoded** (`hashAllFields()`)
- For hash verification on callback: params are **NOT URL-encoded** (`hashAllFieldsForCallback()`) — raw values as received from VNPay

---

### 4.3 VNPay Return Handler (`GET /payment/vnpay-return`)

> ⚠️ **Critical: This endpoint is for USER REDIRECT ONLY.**
> It **MUST NOT** update `Invoice`/`Payment` status or publish any Kafka event.
> Only the IPN handler (`GET /payment/vnpay-ipn`) publishes `PaymentConfirmed`/`PaymentFailed`.
> **Monolith bug**: both Return and IPN call `confirmBookingPayment()` — this causes double-processing (invoice marked PAID twice, booking confirmed twice, loyalty points added twice).
> **In microservice**: Return handler is strictly **read-only** — verify signature, read current `Payment.status` from DB, return display data to frontend (success/failure page). No writes. No events.

**Purpose**: User browser is redirected here by VNPay after payment completes (success or failure). This is a **frontend-facing** redirect.

**⚠️ Critical design note**: In the monolith, `handleVNPayCallback()` is called for both the Return URL **and** performs DB updates (marks invoice PAID, confirms booking). This is a **design flaw**: the Return handler is supposed to be for UI feedback only, not for DB state changes. The IPN handler is the authoritative source. In the microservice, the Return handler should **only read status**, not write.

#### Current Monolith Behavior (step by step)

1. Receive query params (`@RequestParam Map<String, String>`)
2. Extract and remove `vnp_SecureHash` from params map
3. Recompute hash using `hashAllFieldsForCallback(params)` (raw values, no URL-encoding)
4. If hash mismatch → return `{ code: "97", message: "Invalid signature" }`
5. Find `Payment` by `vnp_TxnRef` → `{ code: "01", message: "Payment not found" }` if missing
6. Check `vnp_ResponseCode`:
   - `"00"` → mark `Payment.status = SUCCESS`, `Invoice.status = PAID`, call `bookingService.confirmBookingPayment()`, aggregate revenue
   - Other → mark `Payment.status = FAILED`
7. Return JSON response including `bookingId` (for frontend navigation to success/failure page)

#### Microservice Behavior (read-only)

1. Receive query params
2. Verify `vnp_SecureHash` — return error if invalid
3. Find `Payment` by `vnp_TxnRef` — return error if not found
4. **Read** `Payment.status` and `Invoice.status` (already set by IPN handler)
5. Return `{ bookingId, invoiceId, status, message }` for frontend to render success/failure page
6. **No DB writes. No Kafka events published.**



### 4.4 VNPay IPN Handler (`GET /payment/vnpay-ipn`)

**Purpose**: Server-to-server notification from VNPay. This is the **authoritative** payment outcome handler. VNPay calls this URL directly, not through the user's browser.

#### Step-by-Step Algorithm

**Step 1 — Receive**: VNPay sends `GET /payment/vnpay-ipn` with all params as query string.

**Step 2 — Verify SecureHash**:
```
received = params.get("vnp_SecureHash")
params.remove("vnp_SecureHash")                     // remove before rehashing
hashData = hashAllFieldsForCallback(params)          // sort keys asc; join as key=rawValue&...
computed = HMAC-SHA512(config.hashSecret, hashData)  // uppercase hex
if !computed.equalsIgnoreCase(received):
    return { RspCode: "97", Message: "Invalid signature" }
```

**Step 3 — Find Payment**:
```
txnRef = params.get("vnp_TxnRef")
payment = paymentRepository.findByTransactionCode(txnRef)
if not found:
    return { RspCode: "01", Message: "Payment not found" }
```

**Step 4 — Idempotency Check**:
```
if payment.status != PENDING:
    return { RspCode: "02", Message: "Payment already processed" }
```

**Step 5 — Amount Verification**:
```
vnpAmount = Long.parseLong(params.get("vnp_Amount")) / 100   // VNPay sends amount × 100
if payment.amount.longValue() != vnpAmount:
    return { RspCode: "04", Message: "Invalid amount" }
```

**Step 6 — Process Outcome**:

If `vnp_ResponseCode == "00"` (SUCCESS):
```
payment.status = SUCCESS
payment.paymentDate = now()

invoice.status = PAID
invoice.paidAt = now()
invoiceRepository.save(invoice)

bookingService.confirmBookingPayment(invoice.bookingId)   // → microservice: publish PaymentConfirmed event
revenueAggregationService.processPaymentForRevenue(payment)

response = { RspCode: "00", Message: "Confirm success" }
```

If `vnp_ResponseCode != "00"` (FAILURE):
```
payment.status = FAILED
paymentRepository.save(payment)

// Note: IPN ALWAYS returns RspCode=00 to VNPay even on failure!
response = { RspCode: "00", Message: "Confirm success" }
```

**Step 7 — Return IPN response**:
VNPay requires `{ "RspCode": "00", "Message": "Confirm success" }` as the IPN acknowledgment. Any other `RspCode` tells VNPay to retry the IPN.

> **⚠️ Bug noted**: On payment failure, the monolith returns `RspCode=00`. This correctly tells VNPay not to retry, but does **not** fire `bookingService.refundBooking()`. The booking remains `PENDING` until the 10-min expiry. In the microservice, a `PaymentFailed` event should be published on `responseCode != "00"` to release seat locks.

---

### 4.5 Cash Payment (`POST /payment/cash/{invoiceId}`)

**For counter staff only** (walk-in customers paying cash):

1. Load invoice → `INVOICE_NOT_EXISTED`
2. Guard `invoice.status == PAID` → `INVOICE_ALREADY_PAID`
3. Find `Cash` payment method from DB
4. Generate `txnRef = "CASH" + VNPayUtil.getRandomNumber(10)` — 14-char alphanumeric
5. Persist `Payment` with `status = SUCCESS`, `paymentDate = now()` (no PENDING state for cash)
6. Mark `invoice.status = PAID`, `invoice.paidAt = now()`
7. Call `bookingService.confirmBookingPayment(bookingId)` — tickets created, loyalty points added
8. Call `revenueAggregationService.processPaymentForRevenue(payment)` — revenue aggregation
9. Return `PaymentDetailsResponse { code: "00", status: "SUCCESS" }`

> Unlike VNPay, cash payment is atomic and synchronous — no webhook/redirect flow.

---

## 5. Invoice → Payment Relationship (Summary)

| Property | Value |
|----------|-------|
| **Cardinality** | 1 Invoice : N Payments (multiple attempts allowed) |
| **One per booking** | Enforced by `UNIQUE(booking_id)` on `invoices` |
| **Retry semantics** | A failed VNPay Payment can be retried → creates a new `Payment` record with the same `invoiceId` |
| **Idempotency** | IPN checks `payment.status != PENDING` → returns `RspCode=02` if already processed |
| **`transactionCode` uniqueness** | `UNIQUE` DB constraint on `payments.transaction_code`; generated randomly (12-digit for VNPay, `CASH+10digit` for cash) |

---

## 6. Refund Flow

### 6.1 Trigger

**Admin action**: `PATCH /invoices/{invoiceId}/status?status=REFUNDED`

### 6.2 Steps (in `InvoiceServiceImpl.updateInvoiceStatus()`)

```
1. Load invoice
2. Set invoice.status = REFUNDED
3. Call bookingService.refundBooking(bookingId):
   - Sets booking.status = REFUNDED
   - Releases all ScreeningSeats → status = AVAILABLE
   - Reverses loyalty points: addLoyaltyPoints(customerId, -(earned - spent))
4. Call ticketService.expireTicketsByBookingId(bookingId):
   - Sets all ACTIVE tickets for this booking to EXPIRED
5. Call revenueAggregationService.processInvoiceRefundForRevenue(invoiceId):
   - Subtracts revenue for this invoice from revenue aggregation tables
6. Publish InvoiceRefundedEvent (Spring application event):
   - Triggers email notification to customer via Brevo
7. Save invoice
```

### 6.3 Refund Payment Record

> **Note**: The monolith does **not** create a `Payment` record of `paymentType=REFUND` during the refund flow. `PaymentType.REFUND` is defined in the enum but **never used** in any code path. A refund `Payment` record would be appropriate in the microservice (for audit trail).

---

## 7. API Endpoints

### 7.1 Payment Endpoints

| Method | Endpoint | Access | Request | Response |
|--------|----------|--------|---------|----------|
| `POST` | `/payment/vnpay/{invoiceId}` | Auth | `?returnUrl=...` (optional) | `ApiResponse<PaymentDetailsResponse>` |
| `GET` | `/payment/vnpay-return` | Public (VNPay redirect) | Query params from VNPay | `Map<String, Object>` (JSON for frontend) |
| `GET` | `/payment/vnpay-ipn` | Public (VNPay server call) | Query params from VNPay | `Map<String, Object>` with `RspCode` |
| `POST` | `/payment/cash/{invoiceId}` | Auth (staff) | — | `ApiResponse<PaymentDetailsResponse>` |

#### `PaymentDetailsResponse`

```json
{
  "id":              "payment-uuid",
  "invoiceId":       "invoice-uuid",
  "transactionCode": "123456789012",
  "amount":          270000.00,
  "status":          "PENDING",
  "code":            "00",
  "message":         "Success",
  "paymentUrl":      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

### 7.2 Invoice Endpoints

All invoice read/update endpoints require `INVOICE_READ` or `INVOICE_UPDATE` permission (DB-driven RBAC).

| Method | Endpoint | Permission | Notes |
|--------|----------|------------|-------|
| `GET` | `/invoices` | `INVOICE_READ` | Paginated list; optional `?cinemaId=` filter |
| `GET` | `/invoices/search` | `INVOICE_READ` | `?query=&status=&cinemaId=&page=&size=` |
| `GET` | `/invoices/status/{status}` | `INVOICE_READ` | Filter by `InvoiceStatus` |
| `GET` | `/invoices/date-range` | `INVOICE_READ` | `?startDate=&endDate=` (ISO date-time) |
| `GET` | `/invoices/statistics` | `INVOICE_READ` | Counts + totals per status; optional `?cinemaId=` |
| `GET` | `/invoices/{invoiceId}` | `INVOICE_READ` | Get invoice by ID |
| `GET` | `/invoices/{invoiceId}/detail` | `INVOICE_READ` | Invoice + full booking summary |
| `GET` | `/invoices/booking/{bookingId}` | `INVOICE_READ` | Find invoice by booking ID |
| `PATCH` | `/invoices/{invoiceId}/status` | `INVOICE_UPDATE` | `?status=REFUNDED` — triggers full refund flow |

#### Invoice Pagination Response (from Spring `Page<InvoiceResponse>`)

```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "content": [...],
    "totalElements": 100,
    "totalPages": 10,
    "number": 0,
    "size": 10
  }
}
```

#### `InvoiceStatisticsResponse`

```json
{
  "totalInvoices":    100,
  "pendingInvoices":  20,
  "paidInvoices":     70,
  "failedInvoices":   5,
  "refundedInvoices": 5,
  "totalRevenue":     "18900000.00",
  "pendingAmount":    "5400000.00",
  "refundedAmount":   "1350000.00"
}
```

---

## 8. Kafka Event Contracts

### 8.1 Events Published (Target Microservice Design)

#### `PaymentConfirmed`
- **Topic**: `cinema.payment.payment-confirmed`
- **Trigger**: VNPay IPN or Cash payment succeeds; `invoice.status = PAID`
- **Consumers**: Booking Service (confirm booking, issue tickets, add loyalty points)

```json
{
  "eventId":    "uuid",
  "eventType":  "PaymentConfirmed",
  "occurredAt": "ISO-8601",
  "source":     "payment-service",
  "payload": {
    "bookingId":       "uuid",
    "invoiceId":       "invoice-uuid",
    "paymentId":       "payment-uuid",
    "transactionCode": "123456789012",
    "amountPaid":      270000.00,
    "paymentMethod":   "VNPay",
    "paidAt":          "ISO-8601"
  }
}
```

#### `PaymentFailed`
- **Topic**: `cinema.payment.payment-failed`
- **Trigger**: VNPay `responseCode != "00"` (IPN or Return)
- **Consumers**: Booking Service (release seat locks, expire booking)

```json
{
  "eventId":   "uuid",
  "eventType": "PaymentFailed",
  "occurredAt": "ISO-8601",
  "source":    "payment-service",
  "payload": {
    "bookingId":    "uuid",
    "invoiceId":    "invoice-uuid",
    "paymentId":    "payment-uuid",
    "responseCode": "24",
    "reason":       "Transaction cancelled by customer"
  }
}
```

#### `InvoiceRefunded`
- **Topic**: `cinema.payment.invoice-refunded`
- **Trigger**: `PATCH /invoices/{id}/status?status=REFUNDED`
- **Consumers**: Booking Service (release seats, reverse loyalty points), Notification Service (send refund email)

```json
{
  "eventId":   "uuid",
  "eventType": "InvoiceRefunded",
  "source":    "payment-service",
  "payload": {
    "bookingId":     "uuid",
    "invoiceId":     "invoice-uuid",
    "refundAmount":  270000.00,
    "refundedAt":    "ISO-8601"
  }
}
```

### 8.2 Events Consumed (Target Microservice Design)

#### `BookingCreated`
- **Topic**: `cinema.booking.booking-created`
- **Action**: Auto-create Invoice for the booking; extract and persist `customerEmail` for use in future notification events

```java
// Consumer pseudocode
@KafkaListener(topics = "cinema.booking.booking-created")
void onBookingCreated(BookingCreatedEvent event) {
    if (!invoiceRepository.findByBookingId(event.getPayload().getBookingId()).isPresent()) {
        Invoice invoice = Invoice.builder()
            .bookingId(event.getPayload().getBookingId())
            .customerId(event.getPayload().getCustomerId())       // store for event publishing
            .customerEmail(event.getPayload().getCustomerEmail()) // BR-PAY-001: must store here
            .totalAmount(event.getPayload().getTotalAmount())
            .status(InvoiceStatus.PENDING)
            .build();
        invoiceRepository.save(invoice);
    }
}
```

#### `BookingCancelled`
- **Topic**: `cinema.booking.booking-cancelled`
- **Action**: Mark invoice `FAILED` if still `PENDING`; no refund needed (seats not yet paid for)

---

## 9. VNPay Response Codes Reference

| `vnp_ResponseCode` | Meaning |
|-------------------|---------|
| `00` | Payment success |
| `07` | Deducted money, suspicious transaction |
| `09` | Customer's card/account not registered for internet banking |
| `10` | Authentication failure after 3 attempts |
| `11` | Session expired |
| `12` | Customer's card/account locked |
| `13` | Wrong OTP entered |
| `24` | Customer cancelled transaction |
| `51` | Insufficient funds |
| `65` | Exceeds daily transaction limit |
| `75` | Payment bank under maintenance |
| `79` | Wrong password limit exceeded |
| `97` | **Signature mismatch** (used by our IPN handler internally) |
| `99` | Other errors |

---

## 10. SecureHash Algorithm — Complete Reference

### For Payment Request (`hashAllFields`)
```
1. Take all vnp_ params (sorted ascending by key)
2. For each param where value != null && !empty:
   key_encoded   = URLEncoder.encode(key, UTF-8).replace("+", "%20")
   value_encoded = URLEncoder.encode(value, UTF-8).replace("+", "%20")
3. Join as: "key1=val1&key2=val2&..."
4. hashData = the joined string
5. SecureHash = HMAC-SHA512(hashSecret, hashData) → UPPERCASE hex
```

### For Callback Verification (`hashAllFieldsForCallback`)
```
1. Remove "vnp_SecureHash" from received params
2. Take remaining params (sorted ascending by key)
3. For each param where value != null && !empty:
   (NO URL-encoding — raw values as-is)
3. Join as: "key1=rawval1&key2=rawval2&..."
4. hashData = the joined string
5. computed = HMAC-SHA512(hashSecret, hashData) → UPPERCASE hex
6. Compare: computed.equalsIgnoreCase(received_SecureHash)
```

> ⚠️ **Critical difference**: Request construction uses URL-encoding; callback verification uses raw values. Using the wrong function will cause hash mismatch errors.

---

## 11. Data Ownership

| Table | Notes |
|-------|-------|
| `invoices` | One per booking; cross-domain ref via `bookingId String` |
| `payments` | One per payment attempt; multiple per invoice allowed |
| `payment_methods` | Lookup table seeded with `VNPay`, `Cash` |

---

## 12. Error Codes (Payment-related)

| Error Code | HTTP | When Thrown |
|-----------|------|-------------|
| `INVOICE_NOT_EXISTED` | 400 | Invoice not found by ID |
| `INVOICE_ALREADY_PAID` | 400 | Attempt to pay an already-paid invoice |
| `PAYMENT_METHOD_NOT_EXISTED` | 400 | `VNPay` or `Cash` entry missing from `payment_methods` table |

---

## 13. Enums Reference

| Enum | Values | Notes |
|------|--------|-------|
| `InvoiceStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` | Defined in `payment.entity` package |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED` | `CANCELLED` and `REFUNDED` currently unused in code |
| `PaymentType` | `BOOKING`, `REFUND` | `REFUND` is defined but **never used** — no refund Payment record is created in current code |

---

## 14. Key Implementation Notes for Migration

1. **Remove direct service-to-service calls**: `InvoiceServiceImpl` directly calls `BookingService.confirmBookingPayment()`, `BookingService.refundBooking()`, `TicketService.expireTicketsByBookingId()`. All must become Kafka events in the microservice.

2. **IPN vs Return — duplicate processing risk**: Both IPN and Return handlers call `bookingService.confirmBookingPayment()` in the monolith. If both fire, `confirmBookingPayment()` would try to mark an already-PAID booking as PAID again. The IPN idempotency check (`payment.status != PENDING → RspCode=02`) prevents the double Invoice update, but both handlers independently attempt the booking confirmation. In the microservice, only the IPN should publish `PaymentConfirmed`. The Return handler should be read-only.

3. **`PaymentType.REFUND` is dead code**: No `Payment` record is created during the refund flow. When building the microservice, add a `Payment` record with `paymentType=REFUND` for proper audit trail.

4. **`vnp_Amount` encoding**: Always multiply by 100 when sending to VNPay; always divide by 100 when reading from VNPay IPN/Return.

5. **Timezone for `vnp_CreateDate`**: Must use `Etc/GMT+7` (which is UTC+7 = Vietnam time). Note the Java `TimeZone.getTimeZone("Etc/GMT+7")` sign convention is **inverted** — `Etc/GMT+7` = UTC-7 in standard notation but = UTC+7 in `Etc/GMT` POSIX convention.

6. **`PaymentMethod` seeding required**: Both `VNPay` and `Cash` entries must exist in the `payment_methods` table before payment endpoints work. Missing entries cause `PAYMENT_METHOD_NOT_EXISTED`.

7. **Revenue aggregation**: `RevenueAggregationService.processPaymentForRevenue()` is called after every successful payment. This belongs to the Analytics Service in the microservice architecture and should be handled by consuming `PaymentConfirmed` Kafka events.

---

## Appendix: Class Reference

| Class | Package | Role |
|-------|---------|------|
| `Invoice` | `payment.entity` | Invoice record (1 per booking) |
| `Payment` | `payment.entity` | Payment attempt record (N per invoice) |
| `PaymentMethod` | `payment.entity` | Payment provider lookup |
| `PaymentType` | `payment.entity` | Enum: `BOOKING`, `REFUND` |
| `InvoiceStatus` | `payment.entity` | Enum: `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `PaymentStatus` | `payment.enums` | Enum: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED` |
| `VNPayConfig` | `config` | `@ConfigurationProperties(prefix="vnpay")` — all VNPay config |
| `VNPayUtil` | `payment.util` | Static helpers: HMAC-SHA512, hash builders, random txnRef, IP extraction |
| `PaymentServiceImpl` | `payment.service` | Create VNPay URL, handle IPN/Return, cash payment |
| `InvoiceServiceImpl` | `payment.service` | CRUD invoices, refund flow, statistics |
| `PaymentController` | `payment.controller` | `/payment/vnpay/**`, `/payment/cash/**` |
| `InvoiceController` | `payment.controller` | `/invoices/**` with `INVOICE_READ/UPDATE` permissions |

---

*Updated: 2026-06-21 | Source: direct code read of all entities, services, controllers, utils, config in `payment/` package and `config/VNPayConfig.java`*
