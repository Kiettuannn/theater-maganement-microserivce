package theater_mgnt.microserivce.booking_service.booking.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.response.ComboSummaryResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingSummaryResponse {
    String bookingId;
    String bookingCode;
    BookingStatus status;
    Instant expiresAt;
    Instant confirmedAt;
    Instant cancelledAt;

    String showtimeId;
    String roomId;

    String userId;

    List<SeatSummaryResponse> seats;
    List<ComboSummaryResponse> combos;

    BigDecimal totalAmount;
    String currency;
}
