package theater_mgnt.microserivce.catalog.combo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboItemCreationRequest {

    @Size(min = 3, message = "COMBO_ITEM_NAME_INVALID")
    String name;

    @NotBlank
    String comboId;

    @NotNull
    Integer quantity;
}
