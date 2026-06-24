package theater_mgnt.microserivce.booking_service.booking.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateBookingRequest {
    String customerId;
    String showtimeId;
    List<String> seatIds;
}
