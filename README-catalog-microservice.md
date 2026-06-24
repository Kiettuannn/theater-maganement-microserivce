# 🎬 Kế Hoạch Chuyển Đổi Microservice - Catalog Service

Tài liệu này cung cấp hướng dẫn chi tiết từng bước để tách Catalog Service từ dự án monolith hiện tại, tuân thủ nghiêm ngặt các quy tắc kiến trúc đã được thống nhất.

## 1. Định nghĩa ranh giới và trách nhiệm (Catalog Service)

Catalog Service đóng vai trò là "Read-heavy" service, cung cấp thông tin cốt lõi về phim, phòng chiếu và lịch chiếu.

*   **Database:** `catalog_db` (PostgreSQL).
*   **Entities sở hữu:** `Movie`, `Genre`, `AgeRating`, `Room`, `Seat`, `SeatType`, `Showtime` (đổi tên từ `Screening`).
*   **Entities bị loại bỏ:**
    *   `Cinema`: Hệ thống sẽ chuyển sang mô hình 1 cụm rạp, `Room` là cấp cao nhất.
    *   `ScreeningSeat`: Logic trạng thái ghế chuyển sang Booking Service quản lý bằng `seat_reservation` và Redis.
*   **Redis Cache:** Sử dụng cache cho thông tin suất chiếu với key `catalog:showtime:{showtimeId}`.

---

## 2. Các thay đổi về Database (Migration)

Quá trình tách database cho `catalog_db`:

1.  **Loại bỏ Cinema:**
    *   Xóa bảng `cinemas`.
    *   Xóa cột `cinema_id` trong bảng `rooms`.
2.  **Đổi tên và Cấu trúc Lại Screening thành Showtime:**
    *   Đổi tên bảng `screenings` thành `showtimes`.
    *   Giữ lại các trường: `id`, `movie_id`, `room_id`, `start_time`, `end_time`, `status`.
3.  **Loại bỏ ScreeningSeat:**
    *   **KHÔNG** di chuyển bảng `screening_seats` sang `catalog_db`. Catalog chỉ giữ thông tin sơ đồ ghế vật lý (bảng `seats`).
4.  **Các bảng được giữ nguyên (mang từ monolith sang):**
    *   `movies`, `genres`, `age_ratings`, `movie_genre`.
    *   `rooms`.
    *   `seats`, `seat_types`.

---

## 3. Kiến trúc Mã Nguồn (Catalog Service)

### 3.1. Cấu trúc Package

Tổ chức lại package tập trung vào các domain chính:

```text
com.theatermgnt.catalog
├── configuration       # Cấu hình Redis, Database, OpenFeign, Kafka Consumer (nếu cần tương lai)
├── exception           # Global Exception Handler (chuẩn hóa Error format)
├── movie               # Chứa logic Movie, Genre, AgeRating
├── room                # Chứa logic Room
├── seat                # Chứa logic Seat, SeatType (Sơ đồ ghế tĩnh)
└── showtime            # (Thay thế Screening) Chứa logic lịch chiếu
```

### 3.2. Cập nhật Entity & Logic

1.  **Room & Seat:**
    *   Xóa mọi quan hệ (`@ManyToOne`) tới `Cinema` trong `Room`.
    *   API tạo/sửa Room không còn nhận `cinemaId`.
2.  **Showtime (Screening cũ):**
    *   Refactor `Screening` -> `Showtime`.
    *   **Loại bỏ logic tạo ScreeningSeat:** Xóa hoàn toàn hàm `createScreeningSeatsForRoom` trong `ScreeningService` cũ. Khi tạo suất chiếu mới, Catalog Service chỉ việc lưu thông tin suất chiếu là xong, không cần gen ra từng bản ghi ghế.
    *   **Logic tính toán ghế trống (getScreeningDetail):** API lấy chi tiết suất chiếu của Catalog sẽ KHÔNG CÒN đếm được số ghế `SOLD`. Catalog chỉ trả về thông tin suất chiếu. Frontend sẽ phải gọi 1 API tổng hợp từ API Gateway hoặc gọi riêng 1 API của Booking Service để lấy sơ đồ ghế kèm trạng thái realtime.
3.  **Movie:** Giữ nguyên các chức năng quản lý, phân trang, tìm kiếm.

---

## 4. Thiết kế API (Exposed to Gateway)

Prefix chung qua Gateway: `/catalog/api/v1`

### 4.1. Movie API
*   `GET /movies`
*   `GET /movies/{id}`
*   `GET /movies/slug/{slug}`
*   `POST/PUT/DELETE /movies` (Yêu cầu Role Admin - cấu hình tại Gateway)

### 4.2. Room API
*   `GET /rooms`
*   `GET /rooms/{id}` (Bao gồm danh sách `seats` tĩnh)
*   `POST/PUT/DELETE /rooms` (Yêu cầu Role Admin)

### 4.3. Showtime API
*   `GET /showtimes`
*   `GET /showtimes/{id}`
*   `GET /showtimes/movie/{movieId}`
*   `POST/PUT/DELETE /showtimes` (Yêu cầu Role Admin)

---

## 5. Tương tác với các Service khác

1.  **Giao tiếp Đồng bộ (OpenFeign):**
    *   **Booking Service -> Catalog Service:** Booking Service sẽ gọi sang Catalog qua OpenFeign để xác minh:
        *   `Showtime` có tồn tại và hợp lệ không? (ví dụ: chưa chiếu)
        *   Các `seatId` khách hàng muốn đặt có thực sự thuộc về `roomId` của suất chiếu đó không?
        *   *Lưu ý:* Catalog phải cấu hình Circuit Breaker/Rate Limiter cho các API này.
2.  **Giao tiếp Bất đồng bộ (Kafka):**
    *   Hiện tại, theo kiến trúc đã chốt, Catalog Service **không cần** listen event từ Booking Service để cập nhật trạng thái ghế (do trạng thái này nằm hoàn toàn ở Booking DB).
    *   Catalog Service có thể publish event nếu cần (ví dụ: `showtime.cancelled` nếu admin hủy lịch, để Booking Service biết mà xử lý hoàn tiền).

---

## 6. Checklist Cấu hình Kỹ Thuật (Spring Boot)

1.  **Bảo mật & Xác thực:**
    *   Catalog Service **không** tích hợp Security / JWT logic (không cần spring-boot-starter-security phức tạp).
    *   Mọi Request tới Catalog đều đi qua API Gateway. Gateway sẽ decode JWT và gắn thông tin vào Header (`X-User-Id`, `X-User-Role`).
    *   Nếu API (như tạo phim) cần quyền Admin, Gateway có thể filter, hoặc Catalog đọc header `X-User-Role` để chặn (Interceptor đơn giản).
2.  **Redis Cache:**
    *   Cấu hình Redis Cache cho chi tiết suất chiếu.
    *   Key: `catalog:showtime:{showtimeId}`
    *   TTL: 300s (5 phút) - Sử dụng `@Cacheable` của Spring hoặc RedisTemplate.
3.  **Chuẩn Hóa Error Response:**
    *   Sử dụng `@RestControllerAdvice`.
    *   Bắt buộc trả về format:
        ```json
        {
          "success": false,
          "errorCode": "SHOWTIME_NOT_FOUND",
          "message": "Không tìm thấy suất chiếu",
          "timestamp": "2024-01-01T10:00:00Z"
        }
        ```
4.  **Database Connection:** Cấu hình PostgreSQL (`application.yml`) với HikariCP.
5.  **Service Discovery:** Tích hợp Eureka Client (`spring-cloud-starter-netflix-eureka-client`).

---

## 7. Các bước thực hiện (Roadmap)

*   **Bước 1:** Khởi tạo Spring Boot project mới cho Catalog Service.
*   **Bước 2:** Cài đặt các thư viện (JPA, PostgreSQL, Redis, Eureka Client, OpenFeign).
*   **Bước 3:** Tạo cấu hình chuẩn (Error Handler, Redis Config).
*   **Bước 4:** Di chuyển Entity (`Movie`, `Room`, `Seat`...) từ Monolith sang, xóa bỏ `Cinema` và `ScreeningSeat`.
*   **Bước 5:** Di chuyển và Refactor Repository & Service layer. Tối ưu bỏ các truy vấn rườm rà liên quan đến rạp.
*   **Bước 6:** Di chuyển và Refactor Controller, đảm bảo RESTful.
*   **Bước 7:** Viết Unit Test cho các logic quan trọng.
*   **Bước 8:** Dockerize và viết Kubernetes Deployment.