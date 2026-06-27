package theater_mgnt.microserivce.payment_service.payment.event.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import theater_mgnt.microserivce.payment_service.payment.entity.Invoice;
import theater_mgnt.microserivce.payment_service.payment.entity.InvoiceStatus;
import theater_mgnt.microserivce.payment_service.payment.event.dto.BookingCreatedEvent;
import theater_mgnt.microserivce.payment_service.payment.repository.InvoiceRepository;

import java.math.BigDecimal;

/**
 * Listens to BookingCreated events from Booking Service.
 * Auto-creates a PENDING Invoice so the customer can proceed to payment
 * without a separate HTTP call.
 *
 * Topic: cinema.booking.booking-created
 * Published by: Booking Service outbox relay
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingEventConsumer {

    private final InvoiceRepository invoiceRepository;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "cinema.booking.booking-created",
            groupId = "payment-service",
            containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional
    public void onBookingCreated(String message) {
        try {
            BookingCreatedEvent event = objectMapper.readValue(message, BookingCreatedEvent.class);
            BookingCreatedEvent.Payload payload = event.getPayload();

            if (payload == null || payload.getBookingId() == null) {
                log.warn("BookingCreated event has null payload or bookingId — skipping");
                return;
            }

            String bookingId = payload.getBookingId();

            // Idempotent: skip if invoice already exists
            if (invoiceRepository.findByBookingId(bookingId).isPresent()) {
                log.info("Invoice already exists for booking {} — skipping duplicate event", bookingId);
                return;
            }

            BigDecimal totalAmount = payload.getTotalAmount() != null
                    ? payload.getTotalAmount()
                    : BigDecimal.ZERO;

            Invoice invoice = Invoice.builder()
                    .bookingId(bookingId)
                    .totalAmount(totalAmount)
                    .status(InvoiceStatus.PENDING)
                    .build();

            invoiceRepository.save(invoice);
            log.info("Invoice created (PENDING) for booking {} — amount: {}", bookingId, totalAmount);

        } catch (Exception e) {
            log.error("Failed to process BookingCreated event: {}", e.getMessage(), e);
            // Re-throwing causes Kafka to retry (based on consumer error handler config)
            // For now, log and absorb to avoid poison pill blocking
        }
    }
}
