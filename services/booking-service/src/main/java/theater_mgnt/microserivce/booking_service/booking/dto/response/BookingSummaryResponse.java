package theater_mgnt.microserivce.booking_service.booking.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.response.ComboSummaryResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingSummaryResponse {
    String bookingId;
    BookingStatus status;
    LocalDateTime expiredAt;

    String showtimeId;
    String showtimeTitle;
    LocalDateTime showtimeStartTime;

    List<SeatSummaryResponse> seats;
    List<ComboSummaryResponse> combos;

    BigDecimal totalAmount;
}
