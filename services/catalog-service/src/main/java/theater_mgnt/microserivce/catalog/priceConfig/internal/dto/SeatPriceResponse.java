package theater_mgnt.microserivce.catalog.priceConfig.internal.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatPriceResponse {
    String seatTypeId;
    BigDecimal price;
}
