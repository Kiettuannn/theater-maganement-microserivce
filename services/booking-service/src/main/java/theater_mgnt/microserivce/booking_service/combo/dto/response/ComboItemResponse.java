package theater_mgnt.microserivce.booking_service.combo.dto.response;

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
