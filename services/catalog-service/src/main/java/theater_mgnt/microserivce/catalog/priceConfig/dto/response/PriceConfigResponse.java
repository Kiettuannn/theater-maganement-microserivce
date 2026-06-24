package theater_mgnt.microserivce.catalog.priceConfig.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.catalog.common.enums.DayType;
import theater_mgnt.microserivce.catalog.common.enums.TimeSlot;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PriceConfigResponse {
    String id;
    DayType dayType;
    TimeSlot timeSlot;
    BigDecimal price;

    String seatTypeName;
}
