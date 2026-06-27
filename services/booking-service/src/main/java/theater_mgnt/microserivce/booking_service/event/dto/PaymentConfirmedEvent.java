package theater_mgnt.microserivce.booking_service.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Consumed from: cinema.payment.payment-confirmed
 * Published by: Payment Service after successful VNPay IPN or cash payment.
 * Booking Service confirms the booking, creates tickets.
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
        String paidAt;
        /** "VNPAY" | "CASH" */
        String paymentMethod;
    }
}
