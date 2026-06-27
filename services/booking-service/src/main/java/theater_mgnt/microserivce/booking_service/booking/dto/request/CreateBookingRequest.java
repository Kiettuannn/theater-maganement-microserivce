package theater_mgnt.microserivce.booking_service.booking.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateBookingRequest {
    /** Resolved from JWT sub claim */
    String userId;
    String showtimeId;
    /** IDs of SeatReservation records to book; max 8 */
    List<String> seatReservationIds;
    /** Client-supplied per request attempt — idempotency */
    UUID idempotencyKey;
    /** Optional, defaults to VND */
    String currency;
}
