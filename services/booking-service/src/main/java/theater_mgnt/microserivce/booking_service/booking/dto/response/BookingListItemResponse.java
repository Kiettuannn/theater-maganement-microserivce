package theater_mgnt.microserivce.booking_service.booking.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingListItemResponse {
    String id;
    String customerId;
    String showtimeId;
    String showtimeTitle;
    LocalDateTime showtimeStartTime;
    Integer seatCount;
    BigDecimal totalAmount;
    BookingStatus status;
    LocalDateTime createdAt;
    LocalDateTime expiredAt;
}
