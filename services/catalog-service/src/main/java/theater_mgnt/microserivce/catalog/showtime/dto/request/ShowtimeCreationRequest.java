package theater_mgnt.microserivce.catalog.showtime.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShowtimeCreationRequest {
    @NotNull
    String roomId;

    @NotNull
    String movieId;

    @NotNull
    LocalDateTime startTime;

    @NotNull
    LocalDateTime endTime;
}
