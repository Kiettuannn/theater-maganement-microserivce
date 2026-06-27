package theater_mgnt.microserivce.payment_service.payment.client.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

/**
 * Mirror of BookingSummaryResponse from Booking Service.
 * Only fields relevant for invoice display are included.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingSummaryResponse {
    String bookingId;
    String bookingCode;
    String status;
    String userId;
    String showtimeId;
    BigDecimal totalAmount;
    String currency;
    String expiresAt;
    List<SeatDetail> seats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class SeatDetail {
        String seatReservationId;
        String seatName;
        String seatType;
        BigDecimal price;
    }
}
