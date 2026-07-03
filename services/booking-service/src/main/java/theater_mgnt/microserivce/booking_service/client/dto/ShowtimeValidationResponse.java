package theater_mgnt.microserivce.booking_service.client.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShowtimeValidationResponse {
    String showtimeId;
    String movieTitle;
    LocalDateTime startTime;
    LocalDateTime endTime;
    String status;
    String roomId;
    String roomName;
}
