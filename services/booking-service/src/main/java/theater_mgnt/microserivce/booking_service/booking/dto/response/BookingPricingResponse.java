package theater_mgnt.microserivce.booking_service.booking.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingPricingResponse {
    String bookingId;
    BigDecimal totalAmount;
}
