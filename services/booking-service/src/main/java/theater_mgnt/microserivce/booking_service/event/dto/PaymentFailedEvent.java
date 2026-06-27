package theater_mgnt.microserivce.booking_service.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Consumed from: cinema.payment.payment-failed
 * Published by: Payment Service after VNPay returns a non-success code.
 * Booking Service may use this to release seat hold early (optional).
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
