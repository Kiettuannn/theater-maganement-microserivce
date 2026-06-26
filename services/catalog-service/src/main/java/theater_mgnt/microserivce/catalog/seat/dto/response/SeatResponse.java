package theater_mgnt.microserivce.catalog.seat.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatResponse {
    String id;
    String seatName;
    String rowChair;
    Integer seatNumber;
    String seatTypeId;
}
