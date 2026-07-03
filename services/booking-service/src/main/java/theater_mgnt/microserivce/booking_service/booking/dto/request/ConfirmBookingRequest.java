package theater_mgnt.microserivce.booking_service.booking.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConfirmBookingRequest {
    String contactEmail;
    String contactPhone;
}
