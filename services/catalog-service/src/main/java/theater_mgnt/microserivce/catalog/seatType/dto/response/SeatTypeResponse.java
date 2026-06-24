package theater_mgnt.microserivce.catalog.seatType.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatTypeResponse {
    String id;
    String typeName;
    BigDecimal basePriceModifier;
}
