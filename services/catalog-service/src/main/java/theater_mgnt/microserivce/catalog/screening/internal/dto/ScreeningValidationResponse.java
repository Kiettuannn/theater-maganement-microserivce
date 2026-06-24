package theater_mgnt.microserivce.catalog.screening.internal.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.catalog.screening.enums.ScreeningStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScreeningValidationResponse {
    String showtimeId;
    String movieTitle;
    LocalDateTime startTime;
    LocalDateTime endTime;
    String status;
    String roomId;
}
