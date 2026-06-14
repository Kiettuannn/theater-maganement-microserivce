package theater_mgnt.microserivce.catalog.screening.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Request chỉ cho phép cập nhật thời gian chiếu.
 * Để thay đổi phim hoặc phòng, cần xóa và tạo lại suất chiếu mới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScreeningUpdateRequest {

    @NotNull(message = "startTime is required")
    LocalDateTime startTime;

    @NotNull(message = "endTime is required")
    LocalDateTime endTime;
}
