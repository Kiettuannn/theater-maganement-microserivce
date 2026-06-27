package theater_mgnt.microserivce.booking_service.bookingCombo.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboItemRequest {
    String comboId;
    int quantity;
}
