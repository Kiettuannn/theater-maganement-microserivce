package theater_mgnt.microserivce.payment_service.payment.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Published to: cinema.payment.payment-failed
 * Booking Service may consume this to release the seat hold early (optional).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentFailedEvent {
    String eventType;
    String occurredAt;
    Payload payload;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class Payload {
        String paymentId;
        String invoiceId;
        String bookingId;
        String transactionCode;
        String failureReason;
    }
}
