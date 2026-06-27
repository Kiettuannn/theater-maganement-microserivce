package theater_mgnt.microserivce.booking_service.booking.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingListItemResponse {
    String id;
    String bookingCode;
    String userId;
    String showtimeId;
    Integer seatCount;
    BigDecimal totalAmount;
    BookingStatus status;
    Instant createdAt;
    Instant expiresAt;
}
