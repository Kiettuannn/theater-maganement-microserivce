package theater_mgnt.microserivce.catalog.combo.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboUpdateRequest {

    @Size(min = 1, message = "COMBO_NAME_INVALID")
    String name;

    @Size(min = 1, message = "COMBO_DESCRIPTION_INVALID")
    String description;

    @NotNull(message = "COMBO_PRICE_REQUIRED")
    BigDecimal price;

    // imageUrl is optional — no @NotBlank
    String imageUrl;
}
