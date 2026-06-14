# Danh sách các lỗi và điểm chưa tuân thủ kiến trúc trong Catalog Service

Dựa trên tài liệu `README-catalog-microservice.md`, dưới đây là danh sách các lỗi và các điểm chưa tuân thủ cần được khắc phục trong source code hiện tại của `catalog-service`:

## 1. Chưa loại bỏ hoàn toàn `Cinema` (RoomService.java)
- **Vấn đề:** Theo yêu cầu, `Cinema` phải bị loại bỏ và `Room` sẽ là cấp cao nhất. Tuy nhiên, `RoomService.java` vẫn đang inject `CinemaRepository`, tham chiếu đến entity `Cinema`.
- **Lỗi cụ thể trong code:**
  - Vẫn dùng `request.getCinemaId()` để tìm kiếm và gán `Cinema` cho `Room` khi tạo mới (`createRoom`) và cập nhật (`updateRoom`).
  - Vẫn tồn tại các hàm query theo cinema như `roomRepository.existsByNameAndCinemaId(...)` và `getRoomsByCinema(...)`.
- **Hành động cần thiết:** Xóa hoàn toàn quan hệ với `Cinema` trong entity `Room`, loại bỏ các trường `cinemaId` khỏi `RoomCreationRequest`, `RoomUpdateRequest` và các logic truy vấn liên quan trong `RoomService`.

## 2. Chưa thực hiện refactor `Screening` thành `Showtime`
- **Vấn đề:** Tài liệu yêu cầu đổi tên toàn bộ khái niệm `Screening` sang `Showtime` (kể cả package, tên class, entity, database table).
- **Lỗi cụ thể trong code:**
  - Vẫn sử dụng package `theater_mgnt.microserivce.catalog.screening`.
  - Các Service, Repository vẫn mang tên `ScreeningService`, `ScreeningRepository`.
  - Các Enum và class như `ScreeningStatus` vẫn được sử dụng (thấy cả trong `MovieService.java`).
  - `ErrorCode.java` vẫn dùng các mã lỗi như `SCREENING_NOT_EXISTED`, `SCREENING_TIME_OVERLAP`.
- **Hành động cần thiết:** Đổi tên package, classes, entities, DTOs, interfaces và Error Code từ `Screening` sang `Showtime`.

## 3. Chưa loại bỏ logic liên quan đến `ScreeningSeat` (ScreeningService.java)
- **Vấn đề:** Theo kiến trúc mới, Catalog Service chỉ giữ thông tin rạp và suất chiếu, KHÔNG lưu trạng thái ghế từng suất chiếu (việc này do Booking Service quản lý).
- **Lỗi cụ thể trong code:**
  - `ScreeningService.java` vẫn inject `ScreeningSeatService` và `ScreeningSeatRepository`.
  - Hàm `createScreeningSeatsForRoom(...)` vẫn đang tồn tại và được gọi trong `createScreening(...)` để sinh ra dữ liệu ghế cho suất chiếu.
  - Hàm `getScreeningDetail(...)` vẫn đang gọi `screeningSeatRepository.countBookedSeats(screeningId)` để tính toán số ghế khả dụng.
  - Hàm `deleteScreening(...)` vẫn đang kiểm tra `existsSoldSeat` và gọi `softDeleteByScreeningId`.
- **Hành động cần thiết:** Xóa bỏ hoàn toàn package `screeningSeat`. Xóa logic gọi/tạo ghế trong `ScreeningService/ShowtimeService`. API chi tiết suất chiếu chỉ trả về tổng số ghế, bỏ logic tính toán ghế `SOLD` / `AVAILABLE`.

## 4. Chuẩn hóa Error Response chưa đúng format (GlobalExceptionHandler.java & ErrorCode.java)
- **Vấn đề:** `README` yêu cầu response lỗi phải trả về theo định dạng JSON chuẩn gồm các trường: `success`, `errorCode` (String), `message`, `timestamp`.
- **Lỗi cụ thể trong code:**
  - Hiện tại `GlobalExceptionHandler.java` đang sử dụng class `ApiResponse` với các trường: `code` (kiểu `int`), `message`, `result`.
  - Định nghĩa trong `ErrorCode.java` dùng kiểu `int` cho mã lỗi thay vì `String` (ví dụ: `4005` thay vì `"SHOWTIME_TIME_OVERLAP"`).
- **Hành động cần thiết:** Sửa đổi cấu trúc `ErrorResponse` dùng chung cho các exception (có thể tách biệt với `ApiResponse` thông thường) để có đủ 4 trường `success`, `errorCode` (String), `message`, `timestamp`. Cập nhật lại enum `ErrorCode` để dùng string code.

## 5. Thiếu cấu hình kỹ thuật trong `application.yaml`
- **Vấn đề:** Cấu hình thiếu các thiết lập quan trọng đã được nhắc đến trong file `README`.
- **Lỗi cụ thể trong code:**
  - Mặc dù có thiết lập `cache.type: redis` và host/port, nhưng chưa thấy cấu hình TTL 300s (5 phút) cho Redis.
  - Thiếu cấu hình kết nối tới Eureka Server (`eureka.client.serviceUrl.defaultZone`) theo yêu cầu tích hợp Service Discovery.
- **Hành động cần thiết:** Bổ sung các cấu hình liên quan đến TTL của Redis và Eureka Client vào file `application.yaml`.