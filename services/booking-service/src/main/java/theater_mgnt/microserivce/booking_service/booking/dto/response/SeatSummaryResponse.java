package theater_mgnt.microserivce.booking_service.booking.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatSummaryResponse {
    String seatId;
    String seatReservationId;
    String rowLabel;
    Integer seatNumber;
    String seatName;
    String seatType;
    BigDecimal price;
    SeatReservationStatus status;
}
