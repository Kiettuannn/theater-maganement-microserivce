package theater_mgnt.microserivce.payment_service.payment.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Consumed from: cinema.booking.combos-updated
 * Published by Booking Service after PUT /booking/bookings/{id}/combos.
 * Payment Service listens and updates the existing PENDING Invoice's totalAmount.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingCombosUpdatedEvent {

    String eventType;
    String occurredAt;
    Payload payload;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class Payload {
        String bookingId;
        BigDecimal totalAmount; // seat total + combo total
    }
}
