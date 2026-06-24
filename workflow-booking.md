# 🎬 Booking Workflow

Toàn bộ luồng từ admin cấu hình đến khách hàng nhận vé.

---

## Tổng quan

```
[ADMIN]                          [CATALOG SERVICE]              [BOOKING SERVICE]
  │                                     │                              │
  ├─ Tạo phim/phòng/giá ──────────────►│                              │
  │                                     │                              │
  ├─ Tạo Screening ────────────────────►│                              │
  │                                     │─── Kafka: screening.created ►│
  │                                     │                              │ (auto-init SeatReservation)
  │                                     │                              │
[CUSTOMER]                             │                              │
  ├─ Tạo Booking ─────────────── Feign ►│ (validate showtime)          │
  │                              ◄─────  │                              │
  │ ─────────────────────────────────────────────────────────────────►│
  │                                     │              (lock ghế Redis) │
  ├─ Thêm Combo ────────────────────────────────────────────────────►│
  ├─ Confirm Booking ───────────────────────────────────────────────►│
  │                                     │                    (tạo Vé) │
  ├─ Check-in ──────────────────────────────────────────────────────►│
```

---

## PHASE 1 – Admin: Cấu hình Catalog

### Bước 1 – Tạo phim

| Thứ tự | Service | Hàm |
|--------|---------|-----|
| 1a | `AgeRatingService` | `createAgeRating()` |
| 1b | `GenreService` | `createGenre()` |
| 1c | `MovieService` | `createMovie()` – validate AgeRating + Genre |

### Bước 2 – Tạo phòng + ghế

| Thứ tự | Service | Hàm |
|--------|---------|-----|
| 2a | `SeatTypeService` | `createSeatType()` – định loại ghế (Standard, VIP…) |
| 2b | `RoomService` | `createRoom()` – tạo phòng, nhúng `List<SeatRequest>` |
| | `SeatService` (nội bộ) | `syncSeats()` – tạo từng Seat theo request |

### Bước 3 – Cấu hình giá

| Thứ tự | Service | Hàm |
|--------|---------|-----|
| 3 | `PriceConfigService` | `createPriceConfig()` – mỗi bản ghi = (SeatType + DayType + TimeSlot → price) |

> ⚠️ **Phải tạo PriceConfig cho tất cả SeatType trong phòng trước khi tạo Screening.**

---

## PHASE 2 – Admin: Tạo Screening (trigger Kafka)

```
ScreeningService.createScreening()
  ├─ validateScreeningTime()          ← startTime phải > now
  ├─ validateOverlap()                ← không trùng giờ cùng phòng
  ├─ validatePriceConfigExists()      ← kiểm tra đủ PriceConfig
  ├─ screeningRepository.save()
  └─ ScreeningEventProducer.publishScreeningCreated()
       ├─ Lấy tất cả Seat của phòng
       ├─ Xác định DayType + TimeSlot từ startTime
       ├─ Tra giá từ PriceConfigRepository (cache theo seatTypeId)
       └─ kafkaTemplate.send("catalog.screening.created", event)
```

**Kafka consumer ở Booking Service:**

```
CatalogEventConsumer.onScreeningCreated()
  └─ Tạo SeatReservation(AVAILABLE) cho mỗi ghế
       - price = giá lấy từ event (cố định tại thời điểm tạo screening)
       - seatReservationRepository.saveAll()
```

---

## PHASE 3 – Customer: Tạo Booking

```
BookingServiceImpl.createBooking(request)
  ├─ Validate: seatIds không rỗng, ≤ 8 ghế
  ├─ CatalogClient.validateShowtime(screeningId)    ← [OpenFeign → Catalog]
  │    └─ GET /catalog/internal/screenings/{id}/validate
  │         - status phải là SCHEDULED
  │         - startTime > now
  ├─ seatReservationRepository.findByShowtimeIdAndSeatIdIn()
  ├─ Validate tất cả ghế là AVAILABLE
  ├─ SeatLockService.tryLockAll()                   ← [Redis SETNX TTL 10 phút]
  │    └─ Nếu thất bại → SCREENING_SEATS_NOT_AVAILABLE
  ├─ Đánh dấu SeatReservation → LOCKED, bookingId
  ├─ Tính totalAmount = Σ seat.price
  ├─ bookingRepository.saveAndFlush()               ← Booking(PENDING, expiredAt = +10 phút)
  └─ seatReservationRepository.saveAll()
```

---

## PHASE 4 – Customer: Thêm Combo (tuỳ chọn)

```
BookingComboServiceImpl.updateCombos(bookingId, request)
  ├─ Validate booking PENDING + chưa hết hạn
  ├─ bookingComboRepository.deleteByBookingId()     ← xoá combo cũ
  ├─ Với mỗi combo trong request:
  │    └─ comboRepository.findById() + tạo BookingCombo
  ├─ Tính totalAmount = Σ seatPrice + Σ (combo.price × quantity)
  └─ bookingRepository.save()                       ← cập nhật totalAmount
```

---

## PHASE 5 – Customer: Confirm Booking (sau payment)

```
BookingServiceImpl.confirmBooking(bookingId)
  ├─ Validate booking PENDING + chưa hết hạn
  ├─ booking.status → CONFIRMED
  ├─ seatReservationRepository.confirmByBookingId() ← LOCKED → BOOKED
  ├─ SeatLockService.releaseAll()                   ← giải phóng Redis lock
  ├─ bookingRepository.save()
  └─ TicketServiceImpl.createTickets(bookingId)
       ├─ Validate booking CONFIRMED
       ├─ Với mỗi SeatReservation của booking:
       │    ├─ ticketCodeGenerator.generate()        ← unique code
       │    ├─ qrGenerator.generateQrContent()
       │    └─ Tạo Ticket(ACTIVE, expiresAt = startTime + 2h)
       └─ ticketRepository.saveAll()
```

---

## PHASE 6 – Staff: Check-in vé

```
TicketServiceImpl.checkInTicket(request)
  ├─ ticketRepository.findByTicketCode()
  ├─ Validate status = ACTIVE
  ├─ Validate expiresAt > now  (nếu không → set EXPIRED, ném lỗi)
  ├─ ticket.status → USED
  ├─ ticket.usedAt = now
  └─ ticketRepository.save()
```

---

## PHASE 7 – Huỷ Screening (cascade)

```
ScreeningService.deleteScreening(screeningId)
  ├─ screeningRepository.delete()
  └─ kafkaTemplate.send("catalog.screening.cancelled")

CatalogEventConsumer.onScreeningCancelled()
  ├─ bookingRepository.findActiveBookingsByShowtimeId()   ← PENDING + CONFIRMED
  ├─ Với mỗi booking:
  │    ├─ booking.status → CANCELLED
  │    ├─ seatReservationRepository.releaseAllByBookingId() ← → AVAILABLE
  │    ├─ SeatLockService.releaseAll()
  │    └─ (nếu đã CONFIRMED) ticket → CANCELLED
  ├─ bookingRepository.saveAll()
  └─ seatReservationRepository.deleteByShowtimeId()      ← cleanup toàn bộ
```

---

## Sơ đồ trạng thái ghế

```
AVAILABLE ──[createBooking]──► LOCKED ──[confirmBooking]──► BOOKED
    ▲                             │
    └──[cancelBooking / timeout]──┘
    ▲
    └──[onScreeningCancelled]──────────────────────────────────┘
```

## Sơ đồ trạng thái booking

```
PENDING ──[confirm]──► CONFIRMED ──[cancel / screening deleted]──► CANCELLED
   │
   ├──[cancel]──► CANCELLED
   └──[timeout @Scheduled]──► EXPIRED
```

## Sơ đồ trạng thái vé

```
ACTIVE ──[checkIn]──► USED
  │
  ├──[expireTickets @Scheduled]──► EXPIRED
  └──[onScreeningCancelled]──────► CANCELLED
```

---

## Scheduled Jobs (Booking Service)

| Job | Service | Hàm | Tần suất |
|-----|---------|-----|---------|
| Tự động EXPIRED booking quá hạn | `BookingExpirationService` | `expireBookings()` | Mỗi phút |
| Tự động EXPIRED vé quá giờ chiếu | `TicketServiceImpl` | `expireTickets()` | Mỗi giờ |
