package theater_mgnt.microserivce.payment_service.payment.event.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.payment_service.payment.event.dto.PaymentConfirmedEvent;
import theater_mgnt.microserivce.payment_service.payment.event.dto.PaymentFailedEvent;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Publishes payment outcome events to Kafka.
 *
 * PaymentConfirmed → cinema.payment.payment-confirmed
 *   Booking Service consumes to: confirmBooking → CONFIRMED, createTickets
 *
 * PaymentFailed → cinema.payment.payment-failed
 *   Booking Service may consume to release seat hold early (optional).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventProducer {

    private static final String TOPIC_PAYMENT_CONFIRMED = "cinema.payment.payment-confirmed";
    private static final String TOPIC_PAYMENT_FAILED    = "cinema.payment.payment-failed";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Publish PaymentConfirmed after a successful VNPay IPN or cash payment.
     *
     * @param paymentId       ID of the Payment record
     * @param invoiceId       ID of the Invoice
     * @param bookingId       ID of the Booking (partition key for Booking Service)
     * @param transactionCode VNPay txnRef or CASH+random
     * @param amount          Amount paid
     * @param paymentMethod   "VNPAY" | "CASH"
     */
    @SneakyThrows
    public void publishPaymentConfirmed(String paymentId, String invoiceId,
                                        String bookingId, String transactionCode,
                                        BigDecimal amount, String paymentMethod) {
        PaymentConfirmedEvent event = PaymentConfirmedEvent.builder()
                .eventType("PaymentConfirmed")
                .occurredAt(Instant.now().toString())
                .payload(PaymentConfirmedEvent.Payload.builder()
                        .paymentId(paymentId)
                        .invoiceId(invoiceId)
                        .bookingId(bookingId)
                        .transactionCode(transactionCode)
                        .amount(amount)
                        .paidAt(Instant.now().toString())
                        .paymentMethod(paymentMethod)
                        .build())
                .build();

        String json = objectMapper.writeValueAsString(event);
        kafkaTemplate.send(TOPIC_PAYMENT_CONFIRMED, bookingId, json);
        log.info("PaymentConfirmed published for booking {} via {}", bookingId, paymentMethod);
    }

    /**
     * Publish PaymentFailed after VNPay returns a non-success response code.
     */
    @SneakyThrows
    public void publishPaymentFailed(String paymentId, String invoiceId,
                                     String bookingId, String transactionCode,
                                     String failureReason) {
        PaymentFailedEvent event = PaymentFailedEvent.builder()
                .eventType("PaymentFailed")
                .occurredAt(Instant.now().toString())
                .payload(PaymentFailedEvent.Payload.builder()
                        .paymentId(paymentId)
                        .invoiceId(invoiceId)
                        .bookingId(bookingId)
                        .transactionCode(transactionCode)
                        .failureReason(failureReason)
                        .build())
                .build();

        String json = objectMapper.writeValueAsString(event);
        kafkaTemplate.send(TOPIC_PAYMENT_FAILED, bookingId, json);
        log.warn("PaymentFailed published for booking {} — reason: {}", bookingId, failureReason);
    }
}
