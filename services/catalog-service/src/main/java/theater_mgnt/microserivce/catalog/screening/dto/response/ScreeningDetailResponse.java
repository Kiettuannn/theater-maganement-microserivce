package theater_mgnt.microserivce.catalog.screening.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.catalog.screening.enums.ScreeningStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScreeningDetailResponse {
    String id;
    String movieId;
    String movieName;
    String roomId;
    String roomName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime endTime;

    ScreeningStatus status; // đã sửa từ String sang Enum (Issue D)

    // Thông tin tổng số ghế (không bao gồm số ghế khả dụng - do Booking Service quản lý)
    Integer totalSeats;
}
