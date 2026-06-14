package theater_mgnt.microserivce.booking_service.combo.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboItemUpdateRequest {

    @Size(min = 3, message = "COMBO_ITEM_NAME_INVALID")
    String name;

    @NotNull
    Integer quantity;
}
