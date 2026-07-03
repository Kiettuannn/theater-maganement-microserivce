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
import theater_mgnt.microserivce.payment_service.payment.event.dto.BookingCombosUpdatedEvent;
import theater_mgnt.microserivce.payment_service.payment.repository.InvoiceRepository;

import java.math.BigDecimal;

/**
 * Listens to booking-related events from Booking Service.
 *
 * - BookingCreated       → auto-creates a PENDING Invoice (seats only)
 * - BookingCombosUpdated → syncs invoice.totalAmount = seat + combo total
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingEventConsumer {

    private final InvoiceRepository invoiceRepository;
    private final ObjectMapper objectMapper;

    // ── Handle BookingCreated → create PENDING invoice ──────────────────────

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
        }
    }

    // ── Handle BookingCombosUpdated → sync invoice.totalAmount ──────────────

    /**
     * When user adds combos to an existing booking, booking-service publishes this event.
     * Update the PENDING invoice's totalAmount to include seat + combo prices.
     *
     * If user chose NO combos, this event is NOT published → invoice stays at seat-only total ✅
     */
    @KafkaListener(
            topics = "cinema.booking.combos-updated",
            groupId = "payment-service",
            containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional
    public void onBookingCombosUpdated(String message) {
        try {
            BookingCombosUpdatedEvent event = objectMapper.readValue(message, BookingCombosUpdatedEvent.class);
            BookingCombosUpdatedEvent.Payload payload = event.getPayload();

            if (payload == null || payload.getBookingId() == null) {
                log.warn("BookingCombosUpdated event has null payload — skipping");
                return;
            }

            String bookingId = payload.getBookingId();
            BigDecimal newTotal = payload.getTotalAmount() != null ? payload.getTotalAmount() : BigDecimal.ZERO;

            invoiceRepository.findByBookingId(bookingId).ifPresentOrElse(invoice -> {
                // Only update if invoice is still PENDING (not yet paid/failed)
                if (invoice.getStatus() == InvoiceStatus.PENDING) {
                    invoice.setTotalAmount(newTotal);
                    invoiceRepository.save(invoice);
                    log.info("Invoice for booking {} totalAmount updated to {} (combos synced)", bookingId, newTotal);
                } else {
                    log.warn("Invoice for booking {} is already {} — combo sync skipped", bookingId, invoice.getStatus());
                }
            }, () -> log.warn("No invoice found for booking {} — combo sync skipped (race condition?)", bookingId));

        } catch (Exception e) {
            log.error("Failed to process BookingCombosUpdated event: {}", e.getMessage(), e);
        }
    }
}
