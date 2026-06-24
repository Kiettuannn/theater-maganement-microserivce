package theater_mgnt.microserivce.catalog.priceConfig.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PriceConfigUpdateRequest {

    @NotNull
    String dayType;

    @NotNull
    String timeSlot;

    @NotNull
    BigDecimal price;
}
