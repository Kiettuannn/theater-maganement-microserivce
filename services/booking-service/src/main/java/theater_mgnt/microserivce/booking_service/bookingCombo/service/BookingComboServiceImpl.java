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
import theater_mgnt.microserivce.booking_service.combo.dto.response.ComboItemResponse;
import theater_mgnt.microserivce.booking_service.combo.dto.response.ComboResponse;
import theater_mgnt.microserivce.booking_service.combo.entity.Combo;
import theater_mgnt.microserivce.booking_service.combo.mapper.ComboItemMapper;
import theater_mgnt.microserivce.booking_service.combo.mapper.ComboMapper;
import theater_mgnt.microserivce.booking_service.combo.repository.ComboItemRepository;
import theater_mgnt.microserivce.booking_service.combo.repository.ComboRepository;
import theater_mgnt.microserivce.booking_service.common.exception.AppException;
import theater_mgnt.microserivce.booking_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class BookingComboServiceImpl implements BookingComboService {

    private final BookingComboRepository bookingComboRepository;
    private final BookingRepository bookingRepository;
    private final ComboRepository comboRepository;
    private final ComboItemRepository comboItemRepository;
    private final SeatReservationRepository seatReservationRepository;
    private final ComboMapper comboMapper;
    private final BookingPricingMapper bookingPricingMapper;
    private final ComboItemMapper comboItemMapper;

    @Override
    public BookingPricingResponse updateCombos(String bookingId, UpdateBookingCombosRequest request) {
        Booking booking = getValidPendingBooking(bookingId);

        // Tính lại từ seats (price cố định) + combo mới
        BigDecimal seatTotal = seatReservationRepository.findByBookingId(bookingId).stream()
                .map(s -> s.getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        bookingComboRepository.deleteByBookingId(bookingId);

        BigDecimal comboTotal = BigDecimal.ZERO;
        for (ComboItemRequest item : request.getCombos()) {
            Combo combo = comboRepository.findById(item.getComboId())
                    .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_EXISTED));
            BigDecimal lineTotal = combo.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            bookingComboRepository.save(BookingCombo.builder()
                    .bookingId(bookingId)
                    .comboId(item.getComboId())
                    .comboName(combo.getName())
                    .quantity(item.getQuantity())
                    .unitPrice(combo.getPrice())
                    .subtotal(lineTotal)
                    .build());
            comboTotal = comboTotal.add(lineTotal);
        }

        booking.setTotalAmount(seatTotal.add(comboTotal));
        bookingRepository.save(booking);

        return bookingPricingMapper.toPricingResponse(booking);
    }

    @Override
    public List<ComboCheckInResponse> getCombos(String bookingId) {
        List<ComboCheckInResponse> responses = new ArrayList<>();
        for (BookingCombo bc : bookingComboRepository.findByBookingId(bookingId)) {
            Optional<Combo> cb = comboRepository.findById(bc.getComboId());
            if (cb.isPresent()) {
                ComboResponse cr = comboMapper.toComboResponse(cb.get());
                List<ComboItemResponse> items = comboItemRepository.findByComboId(bc.getComboId()).stream()
                        .map(comboItemMapper::toComboItemResponse)
                        .toList();
                responses.add(new ComboCheckInResponse(bc.getId(), bc.getQuantity(), cr, items));
            }
        }
        return responses;
    }

    private Booking getValidPendingBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(ErrorCode.BOOKING_NOT_PENDING);
        }
        if (booking.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.BOOKING_EXPIRED);
        }
        return booking;
    }
}
