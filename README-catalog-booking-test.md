# 🧪 Postman Test Guide – Catalog & Booking Service

> **Base URLs:**
> - Catalog: `http://localhost:8082/catalog`
> - Booking: `http://localhost:8083/booking`
>
> **Thứ tự test:** Phải chạy **tuần tự từ trên xuống** vì các bước sau phụ thuộc ID của bước trước.  
> **Lưu lại ID** trả về từ mỗi bước (dùng biến Postman hoặc copy thủ công).

---

## 📦 Biến Postman (Đặt trong Collection Variables)

```
CATALOG_URL  = http://localhost:8082/catalog
BOOKING_URL  = http://localhost:8083/booking

age_rating_id   = (điền sau bước 1.1)
genre_id        = (điền sau bước 1.2)
movie_id        = (điền sau bước 1.3)
room_id         = (điền sau bước 1.4)
seat_type_std   = (điền sau bước 1.5)
seat_type_vip   = (điền sau bước 1.5)
seat_id_A1      = (điền sau bước 1.6)
seat_id_A2      = (điền sau bước 1.6)
seat_id_B1      = (điền sau bước 1.6 – VIP)
price_cfg_std   = (điền sau bước 1.7)
price_cfg_vip   = (điền sau bước 1.7)
screening_id    = (điền sau bước 1.8)
booking_id      = (điền sau bước 2.1)
combo_id        = (điền sau bước 3.1)
ticket_code     = (điền sau bước 2.4)
```

---

# PHASE 1 – CATALOG SERVICE SETUP

## 1.1 Tạo Age Rating

```
POST {{CATALOG_URL}}/age_ratings
Content-Type: application/json
```

```json
{
  "id": "P",
  "code": "P",
  "description": "Phim dành cho mọi lứa tuổi"
}
```

**Lưu:** `age_rating_id = "P"`

---

## 1.2 Tạo Genre

```
POST {{CATALOG_URL}}/genres
Content-Type: application/json
```

```json
{
  "id": "action",
  "name": "Hành động"
}
```

**Lưu:** `genre_id = "action"`

---

## 1.3 Tạo Movie

```
POST {{CATALOG_URL}}/movies
Content-Type: application/json
```

```json
{
  "title": "Avengers: Endgame",
  "description": "Phần kết của saga Avengers",
  "duration": 181,
  "director": "Anthony Russo",
  "cast": "Robert Downey Jr., Chris Evans",
  "posterUrl": "https://example.com/poster.jpg",
  "trailerUrl": "https://example.com/trailer.mp4",
  "ageRatingId": "P",
  "genreIds": ["action"],
  "status": "NOW_SHOWING"
}
```

**Lưu:** `movie_id = id` trong response

---

## 1.4 Tạo Room (Phòng chiếu)

```
POST {{CATALOG_URL}}/rooms
Content-Type: application/json
```

```json
{
  "name": "Phòng 1",
  "totalSeats": 3,
  "roomType": "2D"
}
```

**Lưu:** `room_id = id` trong response

---

## 1.5 Tạo Seat Types

### Standard

```
POST {{CATALOG_URL}}/seatTypes
Content-Type: application/json
```

```json
{
  "typeName": "Standard",
  "description": "Ghế thường"
}
```

**Lưu:** `seat_type_std = id`

### VIP

```
POST {{CATALOG_URL}}/seatTypes
Content-Type: application/json
```

```json
{
  "typeName": "VIP",
  "description": "Ghế VIP"
}
```

**Lưu:** `seat_type_vip = id`

---

## 1.6 Tạo Seats trong Room

> ⚠️ Thay `{{room_id}}`, `{{seat_type_std}}`, `{{seat_type_vip}}` bằng giá trị thực.

### Ghế A1 – Standard

```
POST {{CATALOG_URL}}/rooms/{{room_id}}/seats
Content-Type: application/json
```

> *(hoặc dùng endpoint Seat tương ứng – xem SeatController)*

```json
{
  "roomId": "{{room_id}}",
  "rowChair": "A",
  "seatNumber": 1,
  "seatTypeId": "{{seat_type_std}}"
}
```

**Lưu:** `seat_id_A1`

### Ghế A2 – Standard

```json
{
  "roomId": "{{room_id}}",
  "rowChair": "A",
  "seatNumber": 2,
  "seatTypeId": "{{seat_type_std}}"
}
```

**Lưu:** `seat_id_A2`

### Ghế B1 – VIP

```json
{
  "roomId": "{{room_id}}",
  "rowChair": "B",
  "seatNumber": 1,
  "seatTypeId": "{{seat_type_vip}}"
}
```

**Lưu:** `seat_id_B1`

---

## 1.7 Tạo Price Config

> ⚠️ **Bắt buộc:** Phải có đủ PriceConfig cho **cả Standard và VIP**, cho dayType và timeSlot khớp với suất chiếu sắp tạo.  
> Ví dụ: tạo screening lúc 18:00 thứ Tư → `WEEKDAY + EVENING`.

### PriceConfig – Standard – WEEKDAY – EVENING

```
POST {{CATALOG_URL}}/priceConfigs
Content-Type: application/json
```

```json
{
  "seatTypeId": "{{seat_type_std}}",
  "dayType": "WEEKDAY",
  "timeSlot": "EVENING",
  "price": 75000
}
```

**Lưu:** `price_cfg_std`

### PriceConfig – VIP – WEEKDAY – EVENING

```json
{
  "seatTypeId": "{{seat_type_vip}}",
  "dayType": "WEEKDAY",
  "timeSlot": "EVENING",
  "price": 120000
}
```

**Lưu:** `price_cfg_vip`

---

## 1.8 Tạo Screening (Suất Chiếu)

> ⚠️ `startTime` phải trong **tương lai**.  
> ⚠️ **Trigger Kafka:** Sau khi tạo thành công, Booking Service sẽ nhận event và tạo SeatReservation tự động.

```
POST {{CATALOG_URL}}/screenings
Content-Type: application/json
```

```json
{
  "movieId": "{{movie_id}}",
  "roomId": "{{room_id}}",
  "startTime": "2026-12-15T18:00:00",
  "endTime": "2026-12-15T21:01:00"
}
```

**Lưu:** `screening_id = id` trong response

**Kết quả kỳ vọng:**
- HTTP 200 + ScreeningResponse
- Booking Service nhận Kafka event → tạo 3 SeatReservation (AVAILABLE)

---

## 1.9 Verify Seat Map (Kiểm Tra SeatReservation Đã Được Tạo)

> Chờ ~2 giây để Kafka consumer xử lý xong.

```
GET {{BOOKING_URL}}/screenings/{{screening_id}}/seat-map
```

**Kết quả kỳ vọng:**
```json
[
  { "seatName": "A1", "seatTypeName": "Standard", "price": 75000, "status": "AVAILABLE" },
  { "seatName": "A2", "seatTypeName": "Standard", "price": 75000, "status": "AVAILABLE" },
  { "seatName": "B1", "seatTypeName": "VIP", "price": 120000, "status": "AVAILABLE" }
]
```

---

# PHASE 2 – BOOKING FLOW

## 2.1 Tạo Booking (Chọn 2 ghế Standard)

```
POST {{BOOKING_URL}}/bookings
Content-Type: application/json
```

```json
{
  "customerId": "customer-uuid-001",
  "showtimeId": "{{screening_id}}",
  "seatIds": ["{{seat_id_A1}}", "{{seat_id_A2}}"]
}
```

**Lưu:** `booking_id = id`

**Kết quả kỳ vọng:**
```json
{
  "code": 1000,
  "result": {
    "id": "...",
    "status": "PENDING",
    "totalAmount": 150000,
    "expiredAt": "..."
  }
}
```

---

## 2.2 Verify Seat Map Sau Khi Book (Ghế A1, A2 Phải LOCKED)

```
GET {{BOOKING_URL}}/screenings/{{screening_id}}/seat-map
```

**Kết quả kỳ vọng:**
```json
[
  { "seatName": "A1", "status": "LOCKED" },
  { "seatName": "A2", "status": "LOCKED" },
  { "seatName": "B1", "status": "AVAILABLE" }
]
```

---

## 2.3 Xem Booking Summary

```
GET {{BOOKING_URL}}/bookings/{{booking_id}}/summary
```

**Kết quả kỳ vọng:**
```json
{
  "result": {
    "bookingId": "...",
    "status": "PENDING",
    "seats": [
      { "seatName": "A1", "price": 75000, "status": "LOCKED" },
      { "seatName": "A2", "price": 75000, "status": "LOCKED" }
    ],
    "combos": [],
    "totalAmount": 150000
  }
}
```

---

## 2.4 Confirm Booking (Mock – Tạo Tickets)

> Trong production, Payment Service gọi endpoint này sau thanh toán thành công.

```
POST {{BOOKING_URL}}/bookings/{{booking_id}}/confirm
```

*(Không cần body)*

**Kết quả kỳ vọng:**
- HTTP 200, message: `"Booking confirmed successfully"`
- SeatReservation: LOCKED → BOOKED
- 2 Ticket được tạo (ACTIVE)

---

## 2.5 Lấy Danh Sách Vé Của Booking

```
GET {{BOOKING_URL}}/tickets/by-booking/{{booking_id}}
```

**Kết quả kỳ vọng:**
```json
{
  "result": [
    {
      "ticketCode": "TKT-XXXXXXXX",
      "movieTitle": "Avengers: Endgame",
      "seatName": "A1",
      "price": 75000,
      "status": "ACTIVE"
    },
    {
      "ticketCode": "TKT-YYYYYYYY",
      "seatName": "A2",
      "price": 75000,
      "status": "ACTIVE"
    }
  ]
}
```

**Lưu:** `ticket_code = ticketCode` của 1 vé

---

## 2.6 Verify Seat Map Sau Khi Confirm (Phải BOOKED)

```
GET {{BOOKING_URL}}/screenings/{{screening_id}}/seat-map
```

**Kết quả kỳ vọng:**
```json
[
  { "seatName": "A1", "status": "BOOKED" },
  { "seatName": "A2", "status": "BOOKED" },
  { "seatName": "B1", "status": "AVAILABLE" }
]
```

---

# PHASE 3 – COMBO FLOW

## 3.1 Tạo Combo (Admin)

```
POST {{BOOKING_URL}}/combos
Content-Type: application/json
```

```json
{
  "name": "Combo Bắp Nước L",
  "description": "1 bắp + 1 nước size L",
  "price": 65000
}
```

**Lưu:** `combo_id = id`

---

## 3.2 Tạo Booking Thứ 2 (Để Test Thêm Combo)

```
POST {{BOOKING_URL}}/bookings
Content-Type: application/json
```

```json
{
  "customerId": "customer-uuid-002",
  "showtimeId": "{{screening_id}}",
  "seatIds": ["{{seat_id_B1}}"]
}
```

**Lưu:** `booking_id_2 = id`

---

## 3.3 Thêm Combo Vào Booking 2

```
PUT {{BOOKING_URL}}/bookings/{{booking_id_2}}/combos
Content-Type: application/json
```

```json
{
  "combos": [
    {
      "comboId": "{{combo_id}}",
      "quantity": 2
    }
  ]
}
```

**Kết quả kỳ vọng:**
```json
{
  "result": {
    "bookingId": "...",
    "totalAmount": 250000
  }
}
```

> `totalAmount = 120000 (VIP B1) + 65000 × 2 (combo) = 250000`

---

## 3.4 Xem Summary Booking 2 (Có Combo)

```
GET {{BOOKING_URL}}/bookings/{{booking_id_2}}/summary
```

**Kết quả kỳ vọng:**
```json
{
  "result": {
    "seats": [{ "seatName": "B1", "price": 120000 }],
    "combos": [{ "comboName": "Combo Bắp Nước L", "quantity": 2, "unitPrice": 65000, "subtotal": 130000 }],
    "totalAmount": 250000
  }
}
```

---

# PHASE 4 – CHECK-IN FLOW

## 4.1 Xem Vé Trước Khi Check-In

```
GET {{BOOKING_URL}}/tickets/check-in/{{ticket_code}}
```

**Kết quả kỳ vọng:**
- Ticket info + danh sách combos đính kèm booking

---

## 4.2 Check-In Vé

```
POST {{BOOKING_URL}}/tickets/check-in/{{ticket_code}}
```

**Kết quả kỳ vọng:**
```json
{ "result": "Ticket checked in successfully" }
```

**Status ticket:** ACTIVE → USED

---

## 4.3 Check-In Vé Lần 2 (Phải Báo Lỗi)

```
POST {{BOOKING_URL}}/tickets/check-in/{{ticket_code}}
```

**Kết quả kỳ vọng:**
```json
{
  "code": 3021,
  "message": "Ticket is not active"
}
```

---

# PHASE 5 – CANCEL FLOW

## 5.1 Tạo Booking Thứ 3 (Để Test Cancel)

```
POST {{BOOKING_URL}}/bookings
Content-Type: application/json
```

> ⚠️ Cần có thêm ghế trong phòng. Nếu đã hết ghế, tạo thêm screening mới.  
> Hoặc test cancel ngay sau bước 2.1 (trước khi confirm).

```json
{
  "customerId": "customer-uuid-003",
  "showtimeId": "{{screening_id_2}}",
  "seatIds": ["{{seat_id_C1}}"]
}
```

**Lưu:** `booking_id_cancel`

---

## 5.2 Hủy Booking

```
POST {{BOOKING_URL}}/bookings/{{booking_id_cancel}}/cancel
```

**Kết quả kỳ vọng:**
```json
{ "result": "Booking cancelled successfully" }
```

---

## 5.3 Verify Ghế Đã Về AVAILABLE Sau Cancel

```
GET {{BOOKING_URL}}/screenings/{{screening_id_2}}/seat-map
```

**Kết quả kỳ vọng:** Ghế đã cancel → `"status": "AVAILABLE"`

---

## 5.4 Cancel Booking Đã Cancel (Phải Báo Lỗi)

```
POST {{BOOKING_URL}}/bookings/{{booking_id_cancel}}/cancel
```

**Kết quả kỳ vọng:**
```json
{
  "code": 3003,
  "message": "Booking cannot be cancelled in current state"
}
```

---

# PHASE 6 – SCREENING CANCEL FLOW (Kafka)

## 6.1 Tạo Screening Mới (Để Test Delete)

> Lặp lại bước 1.8 với thời gian khác.

```
POST {{CATALOG_URL}}/screenings
Content-Type: application/json
```

```json
{
  "movieId": "{{movie_id}}",
  "roomId": "{{room_id}}",
  "startTime": "2026-12-20T14:00:00",
  "endTime": "2026-12-20T17:01:00"
}
```

**Lưu:** `screening_id_del`

---

## 6.2 Tạo Booking Cho Screening Sẽ Bị Xóa

```
POST {{BOOKING_URL}}/bookings
Content-Type: application/json
```

```json
{
  "customerId": "customer-uuid-004",
  "showtimeId": "{{screening_id_del}}",
  "seatIds": ["{{seat_id_A1}}"]
}
```

**Lưu:** `booking_id_del`

---

## 6.3 Xóa Screening (Trigger Kafka Cancel)

```
DELETE {{CATALOG_URL}}/screenings/{{screening_id_del}}
```

**Kết quả kỳ vọng:**
- HTTP 200
- Kafka event `catalog.screening.cancelled` được publish
- Booking Service nhận event → cancel `booking_id_del` + xóa SeatReservation

---

## 6.4 Verify Booking Bị Cancel Tự Động

```
GET {{BOOKING_URL}}/bookings?showtimeId={{screening_id_del}}
```

**Kết quả kỳ vọng:**
```json
{
  "result": {
    "bookings": [
      { "id": "...", "status": "CANCELLED" }
    ]
  }
}
```

---

# PHASE 7 – ERROR CASES

## 7.1 Tạo Booking Với Ghế Đã Bị Lock

> Dùng lại `seat_id_A1` và `seat_id_A2` (đang BOOKED từ Phase 2).

```
POST {{BOOKING_URL}}/bookings
Content-Type: application/json
```

```json
{
  "customerId": "customer-uuid-999",
  "showtimeId": "{{screening_id}}",
  "seatIds": ["{{seat_id_A1}}"]
}
```

**Kết quả kỳ vọng:**
```json
{
  "code": 3010,
  "message": "One or more seats are not available"
}
```

---

## 7.2 Tạo Booking Vượt Quá 8 Ghế

```
POST {{BOOKING_URL}}/bookings
Content-Type: application/json
```

```json
{
  "customerId": "customer-uuid-999",
  "showtimeId": "{{screening_id}}",
  "seatIds": ["id1", "id2", "id3", "id4", "id5", "id6", "id7", "id8", "id9"]
}
```

**Kết quả kỳ vọng:**
```json
{
  "code": 3007,
  "message": "Maximum 8 seats per booking"
}
```

---

## 7.3 Tạo Screening Khi Chưa Có PriceConfig

> Test case này cần xóa PriceConfig trước hoặc dùng seatType chưa có config.

```
POST {{CATALOG_URL}}/screenings
Content-Type: application/json
```

```json
{
  "movieId": "{{movie_id}}",
  "roomId": "{{room_id}}",
  "startTime": "2026-12-25T09:00:00",
  "endTime": "2026-12-25T12:01:00"
}
```

> ⚠️ `startTime` lúc 09:00 → `MORNING` slot. Nếu chưa có PriceConfig WEEKDAY+MORNING thì:

**Kết quả kỳ vọng:**
```json
{
  "code": 2007,
  "message": "Price config not existed"
}
```

---

## 7.4 Confirm Booking Đã Expire (Thay `expiredAt` Trong DB Để Test)

```
POST {{BOOKING_URL}}/bookings/{{booking_id_expired}}/confirm
```

**Kết quả kỳ vọng:**
```json
{
  "code": 3004,
  "message": "Booking has expired"
}
```

---

# PHASE 8 – LIST & QUERY

## 8.1 Danh Sách Phim Đang Chiếu

```
GET {{CATALOG_URL}}/movies/now-showing
```

---

## 8.2 Suất Chiếu Theo Phim

```
GET {{CATALOG_URL}}/screenings/movie/{{movie_id}}
```

---

## 8.3 Lịch Sử Vé Của Khách Hàng

```
GET {{BOOKING_URL}}/tickets/by-customer/customer-uuid-001
```

---

## 8.4 Danh Sách Booking (Admin Filter)

```
GET {{BOOKING_URL}}/bookings?status=CONFIRMED&page=0&size=10
```

```
GET {{BOOKING_URL}}/bookings?customerId=customer-uuid-001
```

---

# ✅ Checklist Nghiệp Vụ Chính

| # | Luồng | Test Cases Bao Phủ |
|---|-------|--------------------|
| 1 | Setup dữ liệu danh mục | Phase 1 (1.1 → 1.8) |
| 2 | Hiển thị sơ đồ ghế | 1.9, 2.2, 2.6, 5.3 |
| 3 | Đặt vé: chọn ghế → lock | 2.1 |
| 4 | Xem tổng kết booking | 2.3, 3.4 |
| 5 | Thanh toán (mock confirm) | 2.4 |
| 6 | Xem vé + QR | 2.5 |
| 7 | Thêm combo vào booking | 3.1 → 3.4 |
| 8 | Check-in vé tại rạp | 4.1 → 4.3 |
| 9 | Hủy booking | 5.1 → 5.4 |
| 10 | Xóa suất chiếu → auto cancel | 6.1 → 6.4 |
| 11 | Error: ghế không còn | 7.1 |
| 12 | Error: vượt giới hạn ghế | 7.2 |
| 13 | Error: thiếu PriceConfig | 7.3 |
| 14 | Error: check-in vé đã dùng | 4.3 |

---

# 📝 Ghi Chú Quan Trọng

1. **Kafka delay:** Sau khi tạo/xóa Screening, chờ **1-3 giây** rồi mới test seat-map.
2. **Booking expiry:** Booking PENDING expire sau 10 phút (`expiredAt`). Scheduler chạy mỗi 10 giây.
3. **TimeSlot mapping:**
   - `MORNING`: 06:00 – 12:00
   - `AFTERNOON`: 12:00 – 18:00
   - `EVENING`: 18:00 – 23:00
   - `LATE_NIGHT`: 23:00 – 06:00
4. **customerId:** Hiện tại truyền trực tiếp trong body (chưa có API Gateway). Sau này lấy từ JWT header.
5. **Ticket expires:** 3 giờ sau `showtimeStartTime`.
