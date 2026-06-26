package theater_mgnt.microserivce.booking_service.bookingCombo.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Response for check-in staff to see which combos are attached to a booking,
 * how many remain, and their snapshot price.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboCheckInResponse {
    String bookingComboId;
    String comboId;
    String comboName;
    int quantity;
    int remain;
    BigDecimal unitPrice;
    BigDecimal subtotal;
}
