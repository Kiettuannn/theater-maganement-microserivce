package theater_mgnt.microserivce.booking_service.bookingCombo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingPricingResponse;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.mapper.BookingPricingMapper;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.request.ComboItemRequest;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.request.UpdateBookingCombosRequest;
import theater_mgnt.microserivce.booking_service.bookingCombo.repository.BookingComboRepository;
import theater_mgnt.microserivce.booking_service.bookingCombo.service.BookingComboServiceImpl;
import theater_mgnt.microserivce.booking_service.combo.entity.Combo;
import theater_mgnt.microserivce.booking_service.combo.mapper.ComboItemMapper;
import theater_mgnt.microserivce.booking_service.combo.mapper.ComboMapper;
import theater_mgnt.microserivce.booking_service.combo.repository.ComboItemRepository;
import theater_mgnt.microserivce.booking_service.combo.repository.ComboRepository;
import theater_mgnt.microserivce.booking_service.common.exception.AppException;
import theater_mgnt.microserivce.booking_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingComboService – cập nhật combo và tính tiền")
class BookingComboServiceImplTest {

    @Mock BookingComboRepository bookingComboRepository;
    @Mock BookingRepository bookingRepository;
    @Mock ComboRepository comboRepository;
    @Mock ComboItemRepository comboItemRepository;
    @Mock SeatReservationRepository seatReservationRepository;
    @Mock ComboMapper comboMapper;
    @Mock BookingPricingMapper bookingPricingMapper;
    @Mock ComboItemMapper comboItemMapper;

    @InjectMocks BookingComboServiceImpl bookingComboService;

    private Booking pendingBooking;

    @BeforeEach
    void setUp() {
        pendingBooking = Booking.builder()
                .status(BookingStatus.PENDING)
                .expiredAt(LocalDateTime.now().plusMinutes(8))
                .totalAmount(BigDecimal.valueOf(120000))
                .build();
        pendingBooking.setId("booking-1");
    }

    @Test
    @DisplayName("Cập nhật combo thành công: totalAmount = seatTotal + comboTotal")
    void updateCombos_success() {
        Combo combo = Combo.builder()
                .name("Combo Bắp L").price(BigDecimal.valueOf(65000)).build();
        combo.setId("combo-1");

        SeatReservation seat = SeatReservation.builder()
                .price(BigDecimal.valueOf(120000)).build();

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(pendingBooking));
        when(seatReservationRepository.findByBookingId("booking-1")).thenReturn(List.of(seat));
        when(comboRepository.findById("combo-1")).thenReturn(Optional.of(combo));

        BookingPricingResponse expectedResponse = new BookingPricingResponse();
        expectedResponse.setBookingId("booking-1");
        expectedResponse.setTotalAmount(BigDecimal.valueOf(250000));
        when(bookingPricingMapper.toPricingResponse(any())).thenReturn(expectedResponse);

        ComboItemRequest item = new ComboItemRequest();
        item.setComboId("combo-1");
        item.setQuantity(2);

        UpdateBookingCombosRequest req = new UpdateBookingCombosRequest();
        req.setCombos(List.of(item));

        BookingPricingResponse result = bookingComboService.updateCombos("booking-1", req);

        // 120000 (seat) + 65000 * 2 (combo) = 250000
        assertThat(pendingBooking.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(250000));
        verify(bookingComboRepository).deleteByBookingId("booking-1");
        verify(bookingComboRepository).save(any());
        verify(bookingRepository).save(pendingBooking);
        assertThat(result.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(250000));
    }

    @Test
    @DisplayName("Cập nhật combo: booking không phải PENDING → BOOKING_NOT_PENDING")
    void updateCombos_bookingNotPending_throwsError() {
        pendingBooking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(pendingBooking));

        UpdateBookingCombosRequest req = new UpdateBookingCombosRequest();
        req.setCombos(List.of());

        assertThatThrownBy(() -> bookingComboService.updateCombos("booking-1", req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_NOT_PENDING));
    }

    @Test
    @DisplayName("Cập nhật combo: booking hết hạn → BOOKING_EXPIRED")
    void updateCombos_bookingExpired_throwsError() {
        pendingBooking.setExpiredAt(LocalDateTime.now().minusMinutes(1));
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(pendingBooking));

        UpdateBookingCombosRequest req = new UpdateBookingCombosRequest();
        req.setCombos(List.of());

        assertThatThrownBy(() -> bookingComboService.updateCombos("booking-1", req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_EXPIRED));
    }

    @Test
    @DisplayName("Cập nhật combo: combo không tồn tại → COMBO_NOT_EXISTED")
    void updateCombos_comboNotFound_throwsError() {
        SeatReservation seat = SeatReservation.builder()
                .price(BigDecimal.valueOf(120000)).build();

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(pendingBooking));
        when(seatReservationRepository.findByBookingId("booking-1")).thenReturn(List.of(seat));
        when(comboRepository.findById("invalid-combo")).thenReturn(Optional.empty());

        ComboItemRequest item = new ComboItemRequest();
        item.setComboId("invalid-combo");
        item.setQuantity(1);

        UpdateBookingCombosRequest req = new UpdateBookingCombosRequest();
        req.setCombos(List.of(item));

        assertThatThrownBy(() -> bookingComboService.updateCombos("booking-1", req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.COMBO_NOT_EXISTED));
    }
}
