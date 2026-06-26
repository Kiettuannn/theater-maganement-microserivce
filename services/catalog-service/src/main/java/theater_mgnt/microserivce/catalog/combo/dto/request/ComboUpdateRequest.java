package theater_mgnt.microserivce.catalog.combo.dto.request;

import jakarta.validation.constraints.NotBlank;
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

    @Size(min = 3, message = "COMBO_NAME_INVALID")
    String name;

    @Size(min = 3, message = "COMBO_DESCRIPTION_INVALID")
    String description;

    @NotNull
    BigDecimal price;

    @NotBlank
    String imageUrl;
}
