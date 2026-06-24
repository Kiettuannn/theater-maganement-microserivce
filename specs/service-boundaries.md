# Microservice Boundaries — Cinema Management System (Đồ Án)

> **Phạm vi đã rút gọn**: Bỏ Schedule/ShiftType, Equipment, Review/ReviewVote, Chatbot, File Management, QR Code.
> Tập trung vào **6 core services** thể hiện kiến trúc hệ thống và giao tiếp giữa các service.

---

## Tổng quan kiến trúc

```
Client Web / Admin Backoffice
          │
          ▼
┌─────────────────────────────────┐
│   API Gateway (Spring Cloud)    │  ← Route, Auth filter, Rate limit
└─────────────────────────────────┘
          │
          ▼  (Service Discovery - Eureka/Consul)
┌──────────────────────────────────────────────────────────────┐
│                        MICROSERVICES                         │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │   Identity   │   │   Catalog    │   │    Booking       │ │
│  │   Service    │   │   Service    │   │    Service       │ │
│  └──────────────┘   └──────────────┘   └──────────────────┘ │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │   Payment    │   │ Notification │   │   Analytics      │ │
│  │   Service    │   │   Service    │   │   Service        │ │
│  └──────────────┘   └──────────────┘   └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
          │                │                     │
          ▼                ▼                     ▼
  ┌──────────────┐  ┌─────────────┐     ┌──────────────────┐
  │  MySQL (IAM) │  │ PostgreSQL  │     │  Redis           │
  │              │  │ (per svc)   │     │  (seat lock,     │
  └──────────────┘  └─────────────┘     │   catalog cache) │
                                        └──────────────────┘
          │
          ▼
  ┌──────────────────────┐
  │    Message Broker    │  (Kafka)
  └──────────────────────┘
```

---

## Service Boundary Table

| Service | Responsibility | Owns Data (Tables) | Depends On | Key APIs |
|---|---|---|---|---|
| **Identity Service** | Xác thực (JWT / Google OAuth / OTP), phân quyền RBAC, quản lý Account, hồ sơ Customer & Staff, vô hiệu hóa token, loyalty points | `accounts`, `customers`, `staffs`, `roles`, `permissions`, `invalidated_tokens`, `otp_tokens` | *(Root service — không phụ thuộc service nào)* | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/introspect`, `POST /auth/outbound/authenticate`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET/PUT /customers/{id}`, `GET /customers/{id}/loyalty-points`, `GET/POST /staffs`, `GET/PUT /roles`, `GET /permissions` |
| **Catalog Service** | Quản lý nội dung phim (Movie, Genre, AgeRating), hạ tầng vật lý rạp (Cinema, Room, Seat, SeatType với `basePrice`), cấu hình giá (PriceConfig theo DayType × TimeSlot × SeatType), suất chiếu (Screening). Tính toán & snapshot giá khi tạo Screening, publish event cho Booking Service. Catalog data được cache trên Redis | `movies`, `genres`, `age_ratings`, `cinemas`, `rooms`, `seats`, `seat_types`, `price_configs`, `screenings` | Identity Service (xác thực token qua Gateway) | `GET/POST/PUT/DELETE /movies`, `GET /movies/now-showing`, `GET /movies/coming-soon`, `GET /movies/slug/{slug}`, `GET/POST /genres`, `GET/POST /age-ratings`, `GET/POST /cinemas`, `GET/POST /rooms`, `GET/POST/PUT/DELETE /seat-types`, `GET /seats` (by room), `GET/POST/PUT/DELETE /price-configs`, `GET/POST/PUT/DELETE /screenings`, `GET /screenings/{id}`, `GET /screenings/movie/{movieId}` |
| **Booking Service** | Vòng đời đặt vé (Booking), khóa ghế tạm thời qua Redis (SeatReservation), gắn Combo vào booking (BookingCombo), phát sinh Ticket, check-in vé, chuyển vé | `bookings`, `seat_reservations`, `booking_combos`, `combos`, `combo_items`, `tickets` | Catalog Service (sync API/cache: movieId, roomId, screeningId, priceSnapshot), Identity Service (customerId từ token claim), **Redis** (seat lock TTL), **Kafka**: consume `ScreeningCreated`, `ScreeningCancelled`, `PaymentConfirmed`, `PaymentFailed` | `GET /seat-reservations/{screeningId}`, `PUT /seat-reservations/{id}/lock`, `PUT /seat-reservations/{id}/unlock`, `POST /bookings`, `GET /bookings`, `GET /bookings/{id}/summary`, `POST /bookings/{id}/redeem-points`, `POST /bookings/{id}/cancel`, `POST /bookings/{id}/create-invoice-request`, `GET/POST /booking-combos`, `GET/POST/PUT/DELETE /combos`, `GET/POST /combo-items`, `GET /tickets/by-booking/{id}`, `GET /tickets/{code}`, `POST /tickets/check-in/{code}`, `POST /tickets/{code}/mark-for-transfer` |
| **Payment Service** | Tạo và quản lý Invoice, tích hợp VNPay (tạo URL, xử lý IPN/return callback), thanh toán tiền mặt, lưu lịch sử Payment | `invoices`, `payments`, `payment_methods` | Booking Service (sync: bookingId + totalAmount khi tạo invoice); **Kafka**: consume `BookingCreated`, publish `PaymentConfirmed`, `PaymentFailed` | `POST /invoices`, `GET /invoices/{id}`, `GET /invoices/booking/{bookingId}`, `POST /payment/vnpay/{invoiceId}`, `GET /payment/vnpay-return`, `GET /payment/vnpay-ipn`, `POST /payment/cash/{invoiceId}` |
| **Notification Service** | Gửi thông báo đa kênh (email qua Brevo, in-app), quản lý template, tùy chỉnh preference theo user, ghi log delivery. Hoàn toàn event-driven — không gọi sync đến service khác | `notifications`, `notification_logs`, `notification_channels`, `notification_templates`, `notification_preferences` | *(Chỉ consume events từ Kafka — không phụ thuộc sync)* | `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all`, `DELETE /notifications/{id}`, `GET/POST /notification-templates`, `GET/PUT /notification-preferences` |
| **Analytics Service** | Tổng hợp doanh thu từ Payment events (async), báo cáo theo ngày / phim / rạp / kỳ, hỗ trợ tái xử lý (reprocess) khi dữ liệu lỗi | `revenue_reports`, `daily_revenue_summaries`, `movie_revenues`, `revenue_processing_logs` | **Kafka**: consume `PaymentConfirmed`; Catalog Service (sync read-only: tên movie/cinema cho báo cáo) | `GET /revenue/reports?cinemaId=&from=&to=`, `POST /revenue/reports/generate`, `GET /revenue/daily`, `GET /revenue/movie`, `POST /revenue/reprocess` |

---

## Chi tiết Catalog Service — Logic giá & Screening

### PriceConfig
Cấu hình giá theo 3 chiều: `DayType` × `TimeSlot` × `SeatType`.

| Field | Type | Ví dụ |
|---|---|---|
| `dayType` | enum | `WEEKDAY`, `WEEKEND` |
| `timeSlot` | enum | `MORNING`, `AFTERNOON`, `EVENING`, `LATE_NIGHT` |
| `seatType` | FK → SeatType | VIP, Standard, Couple |
| `price` | BigDecimal | 120.000 VND |

> ⚠️ `HOLIDAY` pricing is **not in scope**. All non-weekend days are priced as `WEEKDAY`. Can be added in a future iteration by introducing a `public_holidays` table (keyed by date) and extending `DayType` lookup logic in `PriceConfigService` — no API change required.
> `NIGHT` was renamed to `LATE_NIGHT` in the actual code. Values verified from `DayType.java` and `TimeSlot.java` on 2026-06-21.


### Seat — basePrice
Mỗi `Seat` có field `basePrice` (BigDecimal) là giá mặc định. Dùng làm fallback khi không có PriceConfig khớp.

### Snapshot giá khi tạo Screening
Khi admin tạo một Screening:
1. Catalog Service tra cứu PriceConfig khớp với `(dayType của startTime, timeSlot của startTime, seatType của từng seat trong room)`
2. Nếu có PriceConfig → dùng `priceConfig.price`
3. Nếu không có → fallback về `seat.basePrice`
4. Giá được đóng gói vào event `ScreeningCreated` (kèm danh sách `{seatId, price}`)
5. Booking Service nhận event → tạo `seat_reservation` với `price` đã snapshot → **giá cố định, không thay đổi dù PriceConfig sau này bị sửa**

---

## Chi tiết Booking Service — SeatReservation

`SeatReservation` thay thế `ScreeningSeat` của mono, đảm nhận 2 vai trò:

| Vai trò | Cơ chế |
|---|---|
| Theo dõi trạng thái ghế của suất chiếu | Persistent record trong PostgreSQL (`AVAILABLE` / `LOCKED` / `BOOKED`) |
| Khóa ghế tạm thời trong khi đặt vé | Redis key `seat:lock:{screeningId}:{seatId}` TTL 10 phút |

### Bảng `seat_reservations`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `screeningId` | String | FK snapshot từ event |
| `seatId` | String | FK snapshot từ event |
| `seatName` | String | Denormalized (ví dụ: "A5") |
| `price` | BigDecimal | Snapshot tại thời điểm tạo screening |
| `status` | enum | `AVAILABLE` / `LOCKED` / `BOOKED` |
| `bookingId` | String | null nếu chưa booked |
| `lockUntil` | Instant | null nếu không đang lock |

### Lifecycle

```
ScreeningCreated (Kafka)
  └─ Booking Service tạo seat_reservation cho mỗi seat trong room
       status = AVAILABLE, price = snapshot

Customer chọn ghế
  └─ PUT /seat-reservations/{id}/lock
       status = LOCKED + Redis TTL 10 phút

Booking confirmed (PaymentConfirmed event)
  └─ status = BOOKED

TTL Redis hết / Customer hủy
  └─ status = AVAILABLE (unlock)

ScreeningCancelled (Kafka)
  └─ Booking Service xóa/vô hiệu hóa toàn bộ seat_reservation của screening đó
```

---

## Chi tiết Booking Service — Combo

Combo và ComboItem được quản lý trong Booking Service (vì combo gắn trực tiếp vào booking).

| Table | Mô tả |
|---|---|
| `combos` | Danh mục F&B: name, description, price, imageUrl |
| `combo_items` | Chi tiết từng item trong combo: name, quantity |
| `booking_combos` | Bảng liên kết booking ↔ combo: bookingId, comboId, quantity |

---

## Phân tích phụ thuộc giữa các service

### Synchronous (REST / Feign Client)

```
Identity Service   ◄──── (tất cả service xác thực token qua API Gateway filter)
Catalog Service    ◄──── Booking Service    (lấy thông tin screening, seat khi cần)
Booking Service    ◄──── Payment Service    (lấy bookingId + totalAmount khi tạo invoice)
Catalog Service    ◄──── Analytics Service  (đọc tên movie/cinema cho báo cáo)
```

### Asynchronous (Kafka)

```
Publisher              Topic / Event             Consumers
──────────────────────────────────────────────────────────────────────
Catalog Service  →  ScreeningCreated        →  Booking Service
                                               (tạo seat_reservation hàng loạt)

Catalog Service  →  ScreeningCancelled      →  Booking Service
                                               (hủy toàn bộ seat_reservation)

Booking Service  →  BookingCreated          →  Payment Service
                                            →  Notification Service (xác nhận đặt chỗ)

Payment Service  →  PaymentConfirmed        →  Booking Service (confirm booking + sinh Ticket)
                                            →  Analytics Service (ghi doanh thu)
                                            →  Notification Service (gửi email xác nhận)

Payment Service  →  PaymentFailed           →  Booking Service (giải phóng ghế)
                                            →  Notification Service (alert user)

Booking Service  →  BookingCancelled        →  Payment Service (hoàn tiền nếu đã thanh toán)
                                            →  Notification Service (thông báo huỷ)

Booking Service  →  TicketIssued            →  Notification Service (gửi thông tin vé)

Booking Service  →  LoyaltyPointsEarned     →  Identity Service (cộng điểm customer)
```

---

## Database & Infrastructure

| Service | Database | Lý do chọn |
|---|---|---|
| Identity Service | **MySQL** | Quan hệ chặt Account → Customer/Staff/Role; ACID transaction |
| Catalog Service | **PostgreSQL** + **Redis** | Full-text search Movie; cache screening/movie data (TTL 5–10 phút) |
| Booking Service | **PostgreSQL** + **Redis** | PostgreSQL cho persistent; Redis cho seat lock (TTL 10 phút) |
| Payment Service | **PostgreSQL** | Financial data cần ACID, audit trail, unique constraint transactionCode |
| Notification Service | **PostgreSQL** | Lưu notification history, template, preference |
| Analytics Service | **PostgreSQL** | Denormalized aggregate tables, query phức tạp theo ngày/kỳ |

### Redis Key Patterns

| Key Pattern | TTL | Mục đích | Owner |
|---|---|---|---|
| `seat:lock:{screeningId}:{seatId}` | 10 phút | Khóa ghế tạm thời trong khi customer đặt vé | Booking Service |
| `catalog:movie:{movieId}` | 5 phút | Cache thông tin phim | Catalog Service |
| `catalog:screening:{screeningId}` | 5 phút | Cache suất chiếu | Catalog Service |
| `catalog:cinema:{cinemaId}` | 10 phút | Cache thông tin rạp | Catalog Service |
| `booking:session:{bookingId}` | 15 phút | Session đặt vé đang pending payment | Booking Service |

---

## Luồng nghiệp vụ chính (Happy Path)

```
[ADMIN — Catalog Service]
1.  Tạo Screening      →  POST /screenings
                          └─ Snapshot giá từng ghế (PriceConfig or seat.basePrice)
                          └─ Publish: ScreeningCreated (Kafka)
                             └─ Booking Service tạo seat_reservation × N ghế

[CUSTOMER — Booking flow]
2.  Chọn phim          →  GET /movies/now-showing          (Catalog)
3.  Chọn suất chiếu    →  GET /screenings/{id}             (Catalog)
4.  Xem sơ đồ ghế      →  GET /seat-reservations/{screeningId} (Booking)
5.  Khóa ghế           →  PUT /seat-reservations/{id}/lock (Booking → Redis TTL 10')
6.  Tạo booking        →  POST /bookings                   (Booking → DB)
                          └─ Publish: BookingCreated (→ Payment, Notification)
7.  Thêm combo         →  POST /booking-combos             (Booking)
8.  Áp dụng điểm       →  POST /bookings/{id}/redeem-points (Booking → Identity sync)
9.  Tạo invoice        →  POST /invoices                   (Payment ← bookingId)
10. Thanh toán VNPay   →  POST /payment/vnpay/{invoiceId}  (Payment → VNPay URL)
11. VNPay IPN callback →  GET /payment/vnpay-ipn           (Payment)
                          └─ Publish: PaymentConfirmed
                             ├─ Booking Service → cập nhật status BOOKED + sinh Ticket
                             │   └─ Publish: TicketIssued → Notification Service
                             ├─ Analytics Service → ghi doanh thu
                             └─ Notification Service → gửi email xác nhận

[STAFF — Check-in]
12. Check-in tại rạp   →  POST /tickets/check-in/{code}   (Booking)
```

---

## Những gì đã loại bỏ và lý do

| Module loại bỏ | Lý do |
|---|---|
| `QR Code` | Đơn giản hóa; check-in dùng `ticketCode` text thay vì scan QR |
| `schedule` / `ShiftType` | HR feature phụ, không liên quan đến core booking flow |
| `equipment` | Quản lý tài sản vật lý — không ảnh hưởng kiến trúc giao tiếp service |
| `review` / `reviewVote` | UGC feature độc lập, có thể bổ sung sau |
| `chatbotInternal` / `websocket` | Cần tech stack riêng (pgvector, OpenAI); ngoài scope |
| `file` (Cloudinary wrapper) | Stateless utility — URL ảnh lưu thẳng trong entity của từng service |

---

*Cập nhật: 2026-06-20 | Nguồn: mono-overview.md + high-level-architecture.jpg*