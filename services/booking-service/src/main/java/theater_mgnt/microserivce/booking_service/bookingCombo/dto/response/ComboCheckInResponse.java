package theater_mgnt.microserivce.booking_service.bookingCombo.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.combo.dto.response.ComboItemResponse;
import theater_mgnt.microserivce.booking_service.combo.dto.response.ComboResponse;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboCheckInResponse {
    String bookingComboId;
    int quantity;
    ComboResponse combo;
    List<ComboItemResponse> comboItemResponseList;
}
