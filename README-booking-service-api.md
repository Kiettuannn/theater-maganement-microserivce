# 📡 Booking Service – API Reference

> Context path: `/booking`  
> Port: `8083`  
> Auth: yêu cầu JWT (customerId lấy từ request body tạm thời, sau này từ API Gateway header)

---

## 📋 Bookings – `/booking/bookings`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/bookings` | Tạo booking: chọn ghế, lock Redis, insert PENDING | Frontend – user chọn ghế và đặt |
| `GET` | `/bookings` | Danh sách booking (filter: status, customerId, showtimeId) | Admin panel, Frontend lịch sử |
| `GET` | `/bookings/{bookingId}/summary` | Chi tiết booking: ghế + combo + totalAmount | Frontend trang thanh toán |
| `POST` | `/bookings/{bookingId}/cancel` | Hủy booking: release ghế + Redis + cancel tickets | Frontend, Admin |
| `POST` | `/bookings/{bookingId}/confirm` | Xác nhận booking: PENDING → CONFIRMED + tạo tickets *(mock – Payment sẽ gọi sau)* | Payment Service (future) |
| `PUT` | `/bookings/{bookingId}/combos` | Cập nhật combo đính kèm booking (chỉ lúc PENDING) | Frontend trang thanh toán |

**Request tạo booking:**
```json
{
  "customerId": "uuid",
  "showtimeId": "uuid",
  "seatIds": ["uuid1", "uuid2"]
}
```

**Response tạo booking:**
```json
{
  "id": "uuid",
  "showtimeId": "uuid",
  "showtimeTitle": "Avengers",
  "showtimeStartTime": "2024-12-01T18:00:00",
  "status": "PENDING",
  "totalAmount": 150000,
  "expiredAt": "2024-12-01T10:10:00"
}
```

---

## 💺 Seat Map – `/booking/screenings`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `GET` | `/screenings/{screeningId}/seat-map` | Trạng thái tất cả ghế (AVAILABLE/LOCKED/BOOKED) + giá | Frontend – hiển thị sơ đồ ghế |

**Response mẫu:**
```json
[
  {
    "seatId": "uuid",
    "rowChair": "A",
    "seatNumber": 1,
    "seatName": "A1",
    "seatTypeName": "Standard",
    "price": 75000,
    "status": "AVAILABLE"
  }
]
```

---

## 🎫 Tickets – `/booking/tickets`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `GET` | `/tickets/by-booking/{bookingId}` | Danh sách vé theo booking | Frontend sau khi confirm |
| `GET` | `/tickets/by-customer/{customerId}` | Lịch sử vé của khách hàng | Frontend trang "Vé của tôi" |
| `GET` | `/tickets/{ticketCode}` | Chi tiết vé theo mã | Frontend xem vé |
| `GET` | `/tickets/check-in/{ticketCode}` | Xem vé + combo để check-in (view only) | Staff app – quét mã |
| `POST` | `/tickets/check-in/{ticketCode}` | Check-in vé: ACTIVE → USED | Staff app – xác nhận vào rạp |

**Ticket status flow:**
```
ACTIVE → USED (check-in thành công)
ACTIVE → EXPIRED (hết hạn sau 3h từ startTime)
ACTIVE → CANCELLED (khi booking bị cancel hoặc screening bị xóa)
```

---

## 🍿 Combos (Admin quản lý) – `/booking/combos`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/combos` | Tạo combo (bắp, nước...) | Admin panel |
| `GET` | `/combos` | Danh sách combo | Frontend trang thanh toán |
| `GET` | `/combos/{comboId}` | Chi tiết combo | Admin, Frontend |
| `PUT` | `/combos/{comboId}` | Cập nhật combo | Admin panel |
| `DELETE` | `/combos/{comboId}` | Xóa combo | Admin panel |

## 🍿 Combo Items – `/booking/comboItems`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/comboItems` | Tạo item trong combo | Admin panel |
| `GET` | `/comboItems` | Tất cả combo items | Admin panel |
| `GET` | `/comboItems/{comboItemId}` | Chi tiết item | Admin panel |
| `GET` | `/comboItems/combo/{comboId}` | Items của một combo | Frontend hiển thị nội dung combo |
| `PUT` | `/comboItems/{comboItemId}` | Cập nhật item | Admin panel |
| `DELETE` | `/comboItems/{comboItemId}` | Xóa item | Admin panel |

---

## 🔄 Kafka Events (nhận từ Catalog)

| Topic | Xử lý | Mô tả |
|-------|-------|-------|
| `catalog.screening.created` | `CatalogEventConsumer.onScreeningCreated()` | Tạo SeatReservation(AVAILABLE) cho tất cả ghế, price cố định từ PriceConfig |
| `catalog.screening.cancelled` | `CatalogEventConsumer.onScreeningCancelled()` | Cancel tất cả PENDING/CONFIRMED bookings, release ghế, cancel tickets |

---

## 📌 Gọi ra ngoài (Feign Client)

| Client | Endpoint | Mục đích | Gọi khi |
|--------|----------|----------|---------|
| `CatalogClient` | `GET /catalog/internal/screenings/{id}/validate` | Validate suất chiếu: status + startTime + movieTitle | `createBooking()` – kiểm tra SCHEDULED và chưa bắt đầu |

---

## ⏱️ Scheduled Jobs

| Job | Tần suất | Mục đích |
|-----|---------|---------|
| `BookingExpirationService` | Mỗi 10 giây | Expire booking PENDING quá hạn → release ghế + Redis |
| `TicketExpireScheduler` | Mỗi 5 phút | Expire ticket ACTIVE quá `expiresAt` |
