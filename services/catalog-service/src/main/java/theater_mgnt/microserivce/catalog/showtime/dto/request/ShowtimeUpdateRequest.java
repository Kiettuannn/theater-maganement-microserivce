package theater_mgnt.microserivce.catalog.showtime.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Only allows updating the showtime's time window.
 * To change movie or room, delete and recreate the showtime.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShowtimeUpdateRequest {

    @NotNull(message = "startTime is required")
    LocalDateTime startTime;

    @NotNull(message = "endTime is required")
    LocalDateTime endTime;
}
