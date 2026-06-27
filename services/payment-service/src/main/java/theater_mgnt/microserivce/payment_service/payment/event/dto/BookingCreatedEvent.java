package theater_mgnt.microserivce.payment_service.payment.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

/**
 * Consumed from: cinema.booking.booking-created
 * Published by Booking Service (via outbox) when a booking is INITIATED.
 * Payment Service listens and auto-creates a PENDING Invoice.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingCreatedEvent {

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
        String bookingCode;
        String userId;
        String showtimeId;
        BigDecimal totalAmount;
        String expiresAt;
        List<SeatInfo> seats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class SeatInfo {
        String seatReservationId;
        String seatName;
        BigDecimal price;
    }
}
