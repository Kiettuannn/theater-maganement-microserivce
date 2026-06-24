package theater_mgnt.microserivce.booking_service.seatReservation.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatStatusResponse {
    String seatId;
    String rowChair;
    Integer seatNumber;
    String seatName;
    String seatTypeName;
    BigDecimal price;
    SeatReservationStatus status;
}
