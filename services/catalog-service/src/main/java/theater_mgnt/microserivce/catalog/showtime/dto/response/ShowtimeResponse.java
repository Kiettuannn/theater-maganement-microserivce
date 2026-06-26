package theater_mgnt.microserivce.catalog.showtime.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.catalog.showtime.enums.ShowtimeStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShowtimeResponse {
    String id;
    String movieId;
    String movieName;
    String roomId;
    String roomName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime endTime;

    ShowtimeStatus status; // Fix #11: enum instead of String
}
