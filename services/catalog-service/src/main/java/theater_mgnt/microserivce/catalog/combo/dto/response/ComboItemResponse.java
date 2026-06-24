package theater_mgnt.microserivce.catalog.combo.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboItemResponse {
    String id;
    String comboName;
    String name;
    Integer quantity;
}
