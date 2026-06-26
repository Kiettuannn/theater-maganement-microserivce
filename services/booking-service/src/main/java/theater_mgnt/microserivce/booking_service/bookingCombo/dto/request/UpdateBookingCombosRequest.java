package theater_mgnt.microserivce.booking_service.bookingCombo.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateBookingCombosRequest {
    List<ComboItemRequest> combos;
}
