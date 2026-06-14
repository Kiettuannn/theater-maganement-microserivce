package theater_mgnt.microserivce.booking_service.combo.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboResponse {
    String id;
    String name;
    String description;
    BigDecimal price;
    String imageUrl;
}
