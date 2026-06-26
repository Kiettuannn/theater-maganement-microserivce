# Booking Service API

> **Base URL (qua Gateway):** `http://localhost:8888/api/booking`
> **Base URL (truc tiep):** `http://localhost:8083/booking`
> **Content-Type:** `application/json`

---

## Bookings — `/api/booking/bookings`

### `POST /api/booking/bookings` — Tao booking dat ve
Dat ghe cho mot suat chieu. Ghe duoc khoa bang Redis trong 8 phut.
```json
{
  "userId": "<userId>",
  "showtimeId": "<showtimeId>",
  "seatReservationIds": ["<seatReservationId1>", "<seatReservationId2>"],
  "idempotencyKey": "<uuid-moi-moi-lan-tao>",
  "currency": "VND"
}
```
> **Quan trong:** `idempotencyKey` phai la UUID moi cho moi request khac nhau.
> - Cung key + cung payload: tra ve booking cu (idempotent replay)
> - Cung key + khac payload: loi IDEMPOTENCY_KEY_CONFLICT

**Response (status INITIATED):**
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

### `GET /api/booking/bookings/{bookingId}/summary` — Lay tom tat trang thai booking
Tra ve day du thong tin: ghe, combo, trang thai, confirmedAt.

### `POST /api/booking/bookings/{bookingId}/cancel` — Huy booking
- INITIATED: giai phong Redis lock, ghe ve AVAILABLE
- CONFIRMED: ticket bi CANCELLED

> Khong can body.

### `POST /api/booking/bookings/{bookingId}/confirm` — Xac nhan booking (thu cong / dung de test)

> Khong can body.

### `GET /api/booking/bookings` — Lay danh sach booking voi filter
| Query Param | Mo ta |
|-------------|-------|
| `status` | INITIATED / CONFIRMED / CANCELLED / FAILED |
| `userId` | Loc theo user |
| `showtimeId` | Loc theo suat chieu |
| `page` | So trang (default: 0) |
| `size` | Kich thuoc trang (default: 10) |

```
GET /api/booking/bookings?userId=<userId>&status=CONFIRMED&page=0&size=10
```

---

## Seat Reservations — `/api/booking/seat-reservations`

### `GET /api/booking/seat-reservations` — Lay danh sach ghe voi filter
| Query Param | Mo ta |
|-------------|-------|
| `showtimeId` | Loc theo suat chieu |
| `status` | AVAILABLE / LOCKED / CONFIRMED / CANCELLED |

```
GET /api/booking/seat-reservations?showtimeId=<showtimeId>&status=AVAILABLE
```

### `GET /api/booking/seat-reservations/{showtimeId}` — Lay so do ghe day du cho suat chieu
Tra ve toan bo ghe (moi trang thai) cua mot suat chieu, dung cho giao dien chon ghe.

---

## Tickets — `/api/booking/tickets`

### `GET /api/booking/tickets/by-booking/{bookingId}` — Lay tat ca ve theo booking
Tra ve danh sach ve duoc tao sau khi booking CONFIRMED.

### `GET /api/booking/tickets/my-tickets/{userId}` — Lay tat ca ve cua user

### `GET /api/booking/tickets/{ticketCode}` — Lay chi tiet ve theo ma ve
```
GET /api/booking/tickets/TK-1EF2FD5E
```

### `GET /api/booking/tickets/check-in/{ticketCode}` — Xem thong tin check-in (danh cho nhan vien)

### `POST /api/booking/tickets/check-in/{ticketCode}` — Thuc hien check-in ve
```json
{
  "ticketCode": "TK-1EF2FD5E",
  "staffId": "<staffId>"
}
```
> Body la optional.

### `POST /api/booking/tickets/{ticketCode}/mark-for-transfer` — Danh dau ve cho phep chuyen nhuong

### `POST /api/booking/tickets/{ticketCode}/cancel-transfer` — Huy trang thai chuyen nhuong ve
