# 📡 Catalog Service – API Reference

> Context path: `/catalog`  
> Port: `8082`  
> Auth: yêu cầu JWT (trừ internal endpoints)

---

## 🎬 Movies – `/catalog/movies`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/movies` | Tạo phim mới | Admin panel |
| `GET` | `/movies` | Danh sách tất cả phim | Frontend listing |
| `GET` | `/movies/{id}` | Chi tiết phim theo ID | Frontend, Booking validate |
| `GET` | `/movies/slug/{slug}` | Chi tiết phim theo slug (SEO URL) | Frontend |
| `GET` | `/movies/status/{status}` | Lọc phim theo trạng thái | Admin panel |
| `GET` | `/movies/now-showing` | Phim đang chiếu | Frontend homepage |
| `GET` | `/movies/coming-soon` | Phim sắp chiếu | Frontend homepage |
| `GET` | `/movies/search` | Tìm kiếm phim theo từ khóa | Frontend search bar |
| `GET` | `/movies/genre/{genreId}` | Phim theo thể loại | Frontend filter |
| `PUT` | `/movies/{id}` | Cập nhật thông tin phim | Admin panel |
| `PATCH` | `/movies/{id}/archive` | Ẩn/archive phim | Admin panel |
| `DELETE` | `/movies/{id}` | Xóa phim | Admin panel |

---

## 🏷️ Genres – `/catalog/genres`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/genres` | Tạo thể loại | Admin panel |
| `GET` | `/genres` | Danh sách thể loại | Frontend filter, Admin |
| `GET` | `/genres/{id}` | Chi tiết thể loại | Admin panel |
| `GET` | `/genres/name/{name}` | Tìm thể loại theo tên | Admin panel |

---

## 🔞 Age Ratings – `/catalog/age_ratings`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/age_ratings` | Tạo phân loại độ tuổi | Admin panel |
| `GET` | `/age_ratings` | Danh sách phân loại | Admin, Frontend |
| `GET` | `/age_ratings/{id}` | Chi tiết theo ID | Admin panel |
| `GET` | `/age_ratings/code/{code}` | Tìm theo code (P, K, T13...) | Admin panel |

---

## 🏢 Rooms – `/catalog/rooms`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/rooms` | Tạo phòng chiếu | Admin panel |
| `GET` | `/rooms` | Danh sách phòng | Admin panel |
| `GET` | `/rooms/{roomId}` | Chi tiết phòng | Admin, Screening form |
| `PUT` | `/rooms/{roomId}` | Cập nhật phòng | Admin panel |
| `DELETE` | `/rooms/{roomId}` | Xóa phòng | Admin panel |

---

## 💺 Seat Types – `/catalog/seatTypes`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/seatTypes` | Tạo loại ghế (Standard, VIP, Couple...) | Admin panel |
| `GET` | `/seatTypes` | Danh sách loại ghế | Admin, PriceConfig form |
| `GET` | `/seatTypes/{seatTypeId}` | Chi tiết loại ghế | Admin panel |
| `PUT` | `/seatTypes/{seatTypeId}` | Cập nhật loại ghế | Admin panel |
| `DELETE` | `/seatTypes/{seatTypeId}` | Xóa loại ghế | Admin panel |

---

## 💰 Price Configs – `/catalog/priceConfigs`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/priceConfigs` | Tạo cấu hình giá (seatType + dayType + timeSlot) | Admin panel |
| `GET` | `/priceConfigs` | Danh sách tất cả config giá | Admin panel |
| `GET` | `/priceConfigs/{priceConfigId}` | Chi tiết config giá | Admin panel |
| `GET` | `/priceConfigs/seatType/{seatTypeId}` | Giá của một loại ghế theo ngày/giờ | Admin panel |
| `PUT` | `/priceConfigs/{priceConfigId}` | Cập nhật giá | Admin panel |
| `DELETE` | `/priceConfigs/{priceConfigId}` | Xóa config giá | Admin panel |

> ⚠️ **PriceConfig phải setup đủ trước khi tạo Screening.**  
> `ScreeningService.createScreening()` validate: tất cả seatType trong phòng phải có PriceConfig cho dayType + timeSlot tương ứng.

---

## 🎟️ Screenings – `/catalog/screenings`

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `POST` | `/screenings` | Tạo suất chiếu (→ Kafka event init SeatReservation) | Admin panel |
| `GET` | `/screenings` | Danh sách tất cả suất chiếu | Admin panel |
| `GET` | `/screenings/{screeningId}` | Chi tiết suất chiếu (basic) | Admin panel |
| `GET` | `/screenings/{screeningId}/detail` | Chi tiết đầy đủ + cache Redis | Frontend booking page |
| `GET` | `/screenings/movie/{movieId}` | Suất chiếu theo phim | Frontend chọn suất |
| `GET` | `/screenings/room/{roomId}` | Suất chiếu theo phòng | Admin panel |
| `PUT` | `/screenings/{screeningId}` | Cập nhật suất chiếu (chỉ SCHEDULED) | Admin panel |
| `DELETE` | `/screenings/{screeningId}` | Xóa suất chiếu (→ Kafka event cancel bookings) | Admin panel |

**Kafka Events phát ra:**
- `catalog.screening.created` → Booking Service tạo SeatReservation(AVAILABLE, price cố định)
- `catalog.screening.cancelled` → Booking Service cancel bookings + cleanup

---

## 🔒 Internal API – `/catalog/internal` *(không qua Auth)*

| Method | Path | Mô tả | Gọi ở đâu |
|--------|------|-------|-----------|
| `GET` | `/internal/screenings/{screeningId}/validate` | Validate suất chiếu (status, startTime, movieTitle) | **Booking Service** – `CatalogClient.validateShowtime()` khi tạo booking |
