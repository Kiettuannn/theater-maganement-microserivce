package theater_mgnt.microserivce.booking_service.event.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import theater_mgnt.microserivce.booking_service.booking.service.BookingService;
import theater_mgnt.microserivce.booking_service.event.dto.PaymentConfirmedEvent;
import theater_mgnt.microserivce.booking_service.event.dto.PaymentFailedEvent;

/**
 * Listens to payment outcome events from Payment Service.
 *
 * PaymentConfirmed → confirm booking (INITIATED/PAYMENT_PENDING → CONFIRMED) + create tickets
 * PaymentFailed    → fail booking early (INITIATED → FAILED) + release seat hold
 *
 * Group: booking-service
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventConsumer {

    private final BookingService bookingService;
    private final ObjectMapper objectMapper;

    /**
     * On PaymentConfirmed:
     * 1. Confirm booking → status CONFIRMED
     * 2. Confirm seat reservations → CONFIRMED
     * 3. Create tickets (ACTIVE)
     * 4. Release Redis locks
     * 5. Write TicketIssued + BookingConfirmed outbox records
     */
    @KafkaListener(
            topics = "cinema.payment.payment-confirmed",
            groupId = "booking-service",
            containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional
    public void onPaymentConfirmed(String message) {
        try {
            PaymentConfirmedEvent event = objectMapper.readValue(message, PaymentConfirmedEvent.class);
            PaymentConfirmedEvent.Payload payload = event.getPayload();

            if (payload == null || payload.getBookingId() == null) {
                log.warn("PaymentConfirmed event has null payload/bookingId — skipping");
                return;
            }

            String bookingId = payload.getBookingId();
            log.info("PaymentConfirmed received for booking {} (method: {}, txn: {})",
                    bookingId, payload.getPaymentMethod(), payload.getTransactionCode());

            bookingService.confirmBooking(bookingId, null);

            log.info("Booking {} confirmed via PaymentConfirmed event", bookingId);

        } catch (Exception e) {
            log.error("Failed to process PaymentConfirmed event: {}", e.getMessage(), e);
            // Log and absorb — avoid poison pill; booking expiry scheduler is the fallback
        }
    }

    /**
     * On PaymentFailed:
     * Fail the booking early instead of waiting for the 8-minute expiry scheduler.
     * Releases seat hold (Redis + DB) immediately.
     */
    @KafkaListener(
            topics = "cinema.payment.payment-failed",
            groupId = "booking-service",
            containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional
    public void onPaymentFailed(String message) {
        try {
            PaymentFailedEvent event = objectMapper.readValue(message, PaymentFailedEvent.class);
            PaymentFailedEvent.Payload payload = event.getPayload();

            if (payload == null || payload.getBookingId() == null) {
                log.warn("PaymentFailed event has null payload/bookingId — skipping");
                return;
            }

            String bookingId = payload.getBookingId();
            log.info("PaymentFailed received for booking {} — reason: {}",
                    bookingId, payload.getFailureReason());

            bookingService.cancelBooking(bookingId);

            log.info("Booking {} cancelled via PaymentFailed event", bookingId);

        } catch (Exception e) {
            log.error("Failed to process PaymentFailed event: {}", e.getMessage(), e);
        }
    }
}
