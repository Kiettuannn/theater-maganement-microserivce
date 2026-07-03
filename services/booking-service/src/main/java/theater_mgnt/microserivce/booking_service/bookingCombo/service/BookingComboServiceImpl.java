package theater_mgnt.microserivce.booking_service.bookingCombo.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingPricingResponse;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.mapper.BookingPricingMapper;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.request.ComboItemRequest;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.request.UpdateBookingCombosRequest;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.response.ComboCheckInResponse;
import theater_mgnt.microserivce.booking_service.bookingCombo.entity.BookingCombo;
import theater_mgnt.microserivce.booking_service.bookingCombo.repository.BookingComboRepository;
import theater_mgnt.microserivce.booking_service.client.CatalogClient;
import theater_mgnt.microserivce.booking_service.client.dto.ComboValidationResponse;
import theater_mgnt.microserivce.booking_service.common.exception.AppException;
import theater_mgnt.microserivce.booking_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
@RequiredArgsConstructor
public class BookingComboServiceImpl implements BookingComboService {

    private final BookingComboRepository bookingComboRepository;
    private final BookingRepository bookingRepository;
    private final SeatReservationRepository seatReservationRepository;
    private final CatalogClient catalogClient;
    private final BookingPricingMapper bookingPricingMapper;
    private final theater_mgnt.microserivce.booking_service.outbox.service.OutboxRelayService outboxRelayService;
    private final ObjectMapper objectMapper;

    private static final String TOPIC_COMBOS_UPDATED = "cinema.booking.combos-updated";

    @Override
    public BookingPricingResponse updateCombos(String bookingId, UpdateBookingCombosRequest request) {
        Booking booking = getValidInitiatedBooking(bookingId);

        // Recalculate from snapshotted seat prices
        BigDecimal seatTotal = seatReservationRepository.findByBookingId(bookingId).stream()
                .map(s -> s.getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Delete all existing combo selections for this booking
        bookingComboRepository.deleteByBookingId(bookingId);

        BigDecimal comboTotal = BigDecimal.ZERO;
        for (ComboItemRequest item : request.getCombos()) {
            // Validate combo via Catalog Service REST call (spec §7.1)
            ComboValidationResponse combo;
            try {
                combo = catalogClient.getCombo(item.getComboId());
            } catch (Exception e) {
                throw new AppException(ErrorCode.COMBO_NOT_EXISTED);
            }
            if (combo == null || combo.isDeleted()) {
                throw new AppException(ErrorCode.COMBO_NOT_EXISTED);
            }

            BigDecimal lineTotal = combo.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            bookingComboRepository.save(BookingCombo.builder()
                    .bookingId(bookingId)
                    .comboId(item.getComboId())
                    .comboName(combo.getName())
                    .quantity(item.getQuantity())
                    .remain(item.getQuantity())   // remain starts equal to quantity
                    .unitPrice(combo.getPrice())
                    .subtotal(lineTotal)
                    .build());
            comboTotal = comboTotal.add(lineTotal);
        }

        booking.setTotalAmount(seatTotal.add(comboTotal));
        bookingRepository.save(booking);

        // Publish combos-updated event so payment-service can sync invoice.totalAmount
        outboxRelayService.save(
                "Booking",
                bookingId,
                "booking.combos.updated",
                buildCombosUpdatedPayload(bookingId, seatTotal.add(comboTotal)),
                TOPIC_COMBOS_UPDATED,
                booking.getShowtimeId());

        return bookingPricingMapper.toPricingResponse(booking);
    }

    @SneakyThrows
    private String buildCombosUpdatedPayload(String bookingId, BigDecimal newTotal) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("bookingId", bookingId);
        payload.put("totalAmount", newTotal);
        Map<String, Object> wrapper = new HashMap<>();
        wrapper.put("eventType", "BookingCombosUpdated");
        wrapper.put("occurredAt", Instant.now().toString());
        wrapper.put("payload", payload);
        return objectMapper.writeValueAsString(wrapper);
    }

    @Override
    public List<ComboCheckInResponse> getCombos(String bookingId) {
        return bookingComboRepository.findByBookingId(bookingId).stream()
                .map(bc -> ComboCheckInResponse.builder()
                        .bookingComboId(bc.getId())
                        .comboId(bc.getComboId())
                        .comboName(bc.getComboName())
                        .quantity(bc.getQuantity())
                        .remain(bc.getRemain())
                        .unitPrice(bc.getUnitPrice())
                        .subtotal(bc.getSubtotal())
                        .build())
                .toList();
    }

    private Booking getValidInitiatedBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));
        if (booking.getStatus() != BookingStatus.INITIATED) {
            throw new AppException(ErrorCode.BOOKING_NOT_INITIATED);
        }
        if (booking.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.BOOKING_EXPIRED);
        }
        return booking;
    }
}
