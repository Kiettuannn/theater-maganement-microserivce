package theater_mgnt.microserivce.booking_service.client.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Response from Catalog Service GET /combos/{comboId}.
 * Used by BookingComboService to validate availability and snapshot the price.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboValidationResponse {
    String id;
    String name;
    BigDecimal price;
    /** true if the combo has been soft-deleted in Catalog Service */
    boolean deleted;
}
