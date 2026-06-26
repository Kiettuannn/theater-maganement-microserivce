# Booking Service API

> **Base URL:** `http://localhost:8083/booking`
> **Content-Type:** `application/json`

---

## Bookings — `/bookings`

### `POST /bookings` — Tao booking dat ve
Dat ghe cho mot suat chieu. Ghe duoc khoa bang Redis trong 8 phut cho den khi thanh toan.
```json
{
  "userId": "<userId>",
  "showtimeId": "<showtimeId>",
  "seatReservationIds": ["<seatReservationId1>", "<seatReservationId2>"],
  "idempotencyKey": "<uuid-moi-moi-lan-tao>",
  "currency": "VND"
}
```
> **Quan trong:** `idempotencyKey` phai la UUID moi cho moi request dat ve khac nhau.
> Neu gui lai cung key + cung payload: tra ve booking cu (idempotent).
> Neu gui lai cung key + khac payload: loi IDEMPOTENCY_KEY_CONFLICT.

**Response (INITIATED):**
```json
{
  "bookingId": "<uuid>",
  "bookingCode": "BK-XXXXXXXX",
  "status": "INITIATED",
  "totalAmount": 1.00,
  "currency": "VND",
  "expiresAt": "2026-07-02T14:08:00Z"
}
```

### `GET /bookings/{bookingId}/summary` — Lay tom tat trang thai booking
Tra ve day du thong tin booking bao gom ghe, combo, trang thai.

### `POST /bookings/{bookingId}/cancel` — Huy booking
Huy booking o bat ky trang thai (INITIATED, CONFIRMED).
- Neu INITIATED: giai phong khoa Redis, tra ghe ve AVAILABLE
- Neu CONFIRMED: ticket bi CANCELLED

> Khong can body.

### `POST /bookings/{bookingId}/confirm` — Xac nhan booking thu cong
Thuong duoc goi tu Kafka event PaymentConfirmed. Co the goi thu cong de test.

> Khong can body.

### `GET /bookings` — Lay danh sach booking voi filter
| Query Param | Mo ta |
|-------------|-------|
| `status` | INITIATED / CONFIRMED / CANCELLED / FAILED |
| `userId` | Loc theo user |
| `showtimeId` | Loc theo suat chieu |
| `page` | So trang (default: 0) |
| `size` | Kich thuoc trang (default: 10) |

```
GET /bookings?userId=60940a76-...&status=CONFIRMED&page=0&size=10
```

---

## Seat Reservations — `/seat-reservations`

### `GET /seat-reservations` — Lay danh sach ghe voi filter
Xem trang thai ghe (AVAILABLE, LOCKED, CONFIRMED, CANCELLED).
| Query Param | Mo ta |
|-------------|-------|
| `showtimeId` | Loc theo suat chieu |
| `status` | Loc theo trang thai ghe |

```
GET /seat-reservations?showtimeId=0e312295-...&status=AVAILABLE
```

### `GET /seat-reservations/{showtimeId}` — Lay so do ghe day du cho suat chieu
Tra ve toan bo ghe cua mot suat chieu (moi trang thai), dung cho giao dien chon ghe.

---

## Tickets — `/tickets`

### `GET /tickets/by-booking/{bookingId}` — Lay tat ca ve theo booking
Tra ve danh sach ve duoc tao sau khi booking CONFIRMED.

### `GET /tickets/my-tickets/{userId}` — Lay tat ca ve theo user

### `GET /tickets/{ticketCode}` — Lay chi tiet ve theo ma ve
```
GET /tickets/TK-1EF2FD5E
```

### `GET /tickets/check-in/{ticketCode}` — Xem thong tin check-in (danh cho nhan vien)
Tra ve thong tin ve de hien thi man hinh check-in.

### `POST /tickets/check-in/{ticketCode}` — Thuc hien check-in ve
Danh dau ve da su dung (USED). Goi boi nhan vien tai rap.
```json
{
  "ticketCode": "TK-1EF2FD5E",
  "staffId": "<staffId>"
}
```
> Body la optional — neu khong gui thi chi can path variable.

### `POST /tickets/{ticketCode}/mark-for-transfer` — Danh dau ve cho phep chuyen nhuong

### `POST /tickets/{ticketCode}/cancel-transfer` — Huy trang thai chuyen nhuong ve
