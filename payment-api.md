# Payment Service API

> **Base URL:** `http://localhost:8085/payment`
> **Content-Type:** `application/json`

---

## Payment — `/payment`

### `POST /payment/cash/{invoiceId}` — Thanh toan tien mat
Xu ly thanh toan tuc thi (khong qua cong thanh toan). 
- Danh dau Invoice la PAID
- Publish Kafka event PaymentConfirmed → Booking Service xac nhan booking + tao ticket

> Khong can body.

**Response:**
```json
{
  "id": "<paymentId>",
  "invoiceId": "<invoiceId>",
  "amount": 1.00,
  "transactionCode": "CASH7175235945",
  "status": "SUCCESS",
  "code": "00",
  "message": "Cash payment successful"
}
```

### `POST /payment/vnpay/{invoiceId}` — Thanh toan VNPay (Demo Mode)
Hien tai chay o che do demo — xu ly thanh toan tuc thi giong Cash.
Khong can redirect qua trang VNPay.
- Danh dau Invoice la PAID
- Publish Kafka event PaymentConfirmed

> Khong can body. Query param `returnUrl` la optional (dung cho production).

```
POST /payment/vnpay/{invoiceId}
POST /payment/vnpay/{invoiceId}?returnUrl=http://localhost:3000/payment-result
```

**Response:**
```json
{
  "id": "<paymentId>",
  "invoiceId": "<invoiceId>",
  "amount": 1.00,
  "transactionCode": "VNPAY1234567890",
  "status": "SUCCESS",
  "code": "00",
  "message": "VNPay payment successful (demo mode)"
}
```

### `GET /payment/vnpay-return` — Callback sau khi user hoan thanh tren VNPay
Duoc VNPay redirect nguoi dung ve sau khi thanh toan. Chi mang tinh tham khao, khong phai nguon chinh xac.

### `GET /payment/vnpay-ipn` — VNPay IPN server-to-server callback
Duoc VNPay goi de xac nhan ket qua thanh toan (nguon chinh xac). Tu dong xu ly trong production.

---

## Invoices — `/invoices`

### `POST /invoices` — Tao invoice thu cong (fallback)
Thuong invoice duoc tu dong tao qua Kafka sau khi booking INITIATED.
Dung endpoint nay khi Kafka event bi mat.
```json
{
  "bookingId": "<bookingId>"
}
```

### `GET /invoices` — Lay tat ca invoice (phan trang)
| Query Param | Mac dinh | Mo ta |
|-------------|----------|-------|
| `page` | `0` | So trang |
| `size` | `10` | Kich thuoc trang |

```
GET /invoices?page=0&size=10
```

### `GET /invoices/{invoiceId}` — Lay chi tiet invoice theo ID

### `GET /invoices/{invoiceId}/detail` — Lay invoice kem thong tin booking day du
Goi Feign sang Booking Service de lay thong tin booking.

### `GET /invoices/booking/{bookingId}` — Lay invoice theo bookingId

### `GET /invoices/status/{status}` — Lay invoice theo trang thai (phan trang)
> `status`: `PENDING` | `PAID` | `FAILED` | `REFUNDED`
```
GET /invoices/status/PENDING?page=0&size=10
```

### `GET /invoices/search` — Tim kiem invoice
| Query Param | Bat buoc | Mo ta |
|-------------|----------|-------|
| `query` | Co | Tim trong invoiceId hoac bookingId |
| `status` | Khong | Loc them theo trang thai |
| `page` | Khong | So trang (default: 0) |
| `size` | Khong | Kich thuoc trang (default: 10) |

```
GET /invoices/search?query=4f074405&status=PAID
```

### `GET /invoices/date-range` — Lay invoice theo khoang thoi gian
```
GET /invoices/date-range?startDate=2026-06-01T00:00:00&endDate=2026-06-30T23:59:59&page=0&size=10
```

### `GET /invoices/statistics` — Lay thong ke invoice
Tra ve tong so va tong tien theo tung trang thai (PENDING, PAID, FAILED, REFUNDED).

### `PATCH /invoices/{invoiceId}/status` — Cap nhat trang thai invoice thu cong
```
PATCH /invoices/{invoiceId}/status?status=PAID
```
> `status`: `PENDING` | `PAID` | `FAILED` | `REFUNDED`

---

## Luong thanh toan dung cho demo

```
1. POST /booking/bookings          (Booking Service)  → Tao booking
2. GET  /payment/invoices/booking/{bookingId}         → Lay invoiceId
3. POST /payment/payment/cash/{invoiceId}             → Thanh toan Cash
   HOAC
   POST /payment/payment/vnpay/{invoiceId}            → Thanh toan VNPay (demo)
4. GET  /booking/bookings/{bookingId}/summary         → Kiem tra CONFIRMED
5. GET  /booking/tickets/by-booking/{bookingId}       → Kiem tra ticket ACTIVE
```
