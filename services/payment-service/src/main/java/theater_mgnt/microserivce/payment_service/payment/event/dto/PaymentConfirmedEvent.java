package theater_mgnt.microserivce.payment_service.payment.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Published to: cinema.payment.payment-confirmed
 * Booking Service consumes this to confirm booking, create tickets, publish TicketIssued.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentConfirmedEvent {
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
        BigDecimal amount;
        /** ISO-8601 */
        String paidAt;
        /** "VNPAY" | "CASH" */
        String paymentMethod;
    }
}
