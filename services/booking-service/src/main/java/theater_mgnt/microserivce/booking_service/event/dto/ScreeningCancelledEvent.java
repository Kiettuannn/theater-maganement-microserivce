package theater_mgnt.microserivce.booking_service.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScreeningCancelledEvent {
    String screeningId;
    String reason;
}
