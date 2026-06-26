package theater_mgnt.microserivce.booking_service.booking;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import theater_mgnt.microserivce.booking_service.booking.dto.request.CreateBookingRequest;
import theater_mgnt.microserivce.booking_service.booking.dto.response.CreateBookingResponse;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.mapper.BookingMapper;
import theater_mgnt.microserivce.booking_service.booking.mapper.BookingSummaryMapper;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.booking.service.BookingServiceImpl;
import theater_mgnt.microserivce.booking_service.bookingCombo.repository.BookingComboRepository;
import theater_mgnt.microserivce.booking_service.client.CatalogClient;
import theater_mgnt.microserivce.booking_service.client.dto.ShowtimeValidationResponse;
import theater_mgnt.microserivce.booking_service.common.exception.AppException;
import theater_mgnt.microserivce.booking_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;
import theater_mgnt.microserivce.booking_service.seatReservation.service.SeatLockService;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;
import theater_mgnt.microserivce.booking_service.ticket.repository.TicketRepository;
import theater_mgnt.microserivce.booking_service.ticket.service.TicketService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingService – business logic tests")
class BookingServiceImplTest {

    @Mock BookingRepository bookingRepository;
    @Mock BookingComboRepository bookingComboRepository;
    @Mock SeatReservationRepository seatReservationRepository;
    @Mock TicketRepository ticketRepository;
    @Mock BookingMapper bookingMapper;
    @Mock BookingSummaryMapper bookingSummaryMapper;
    @Mock TicketService ticketService;
    @Mock CatalogClient catalogClient;
    @Mock SeatLockService seatLockService;

    @InjectMocks BookingServiceImpl bookingService;

    private ShowtimeValidationResponse validShowtime;
    private SeatReservation seatA1, seatA2;

    @BeforeEach
    void setUp() {
        validShowtime = ShowtimeValidationResponse.builder()
                .showtimeId("screening-1")
                .movieTitle("Avengers: Endgame")
                .startTime(LocalDateTime.now().plusDays(7))
                .endTime(LocalDateTime.now().plusDays(7).plusHours(3))
                .status("SCHEDULED")
                .roomId("room-1")
                .build();

        seatA1 = SeatReservation.builder()
                .showtimeId("screening-1")
                .seatId("seat-A1")
                .rowChair("A").seatNumber(1)
                .seatTypeName("Standard")
                .price(BigDecimal.valueOf(75000))
                .status(SeatReservationStatus.AVAILABLE)
                .build();

        seatA2 = SeatReservation.builder()
                .showtimeId("screening-1")
                .seatId("seat-A2")
                .rowChair("A").seatNumber(2)
                .seatTypeName("Standard")
                .price(BigDecimal.valueOf(75000))
                .status(SeatReservationStatus.AVAILABLE)
                .build();
    }

    // =========================================================
    // CREATE BOOKING – HAPPY PATH
    // =========================================================

    @Test
    @DisplayName("Tạo booking thành công: 2 ghế AVAILABLE → PENDING, totalAmount = sum(price)")
    void createBooking_success() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setCustomerId("cus-001");
        req.setShowtimeId("screening-1");
        req.setSeatIds(List.of("seat-A1", "seat-A2"));

        when(catalogClient.validateShowtime("screening-1")).thenReturn(validShowtime);
        when(seatReservationRepository.findByShowtimeIdAndSeatIdIn("screening-1", List.of("seat-A1", "seat-A2")))
                .thenReturn(List.of(seatA1, seatA2));
        when(seatLockService.tryLockAll(any(), any(), any())).thenReturn(true);

        Booking savedBooking = Booking.builder()
                .customerId("cus-001").showtimeId("screening-1")
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(150000))
                .expiredAt(LocalDateTime.now().plusMinutes(10))
                .build();
        when(bookingRepository.saveAndFlush(any())).thenReturn(savedBooking);

        CreateBookingResponse expectedResponse = CreateBookingResponse.builder()
                .status(BookingStatus.PENDING).totalAmount(BigDecimal.valueOf(150000)).build();
        when(bookingMapper.toCreateBookingResponse(any())).thenReturn(expectedResponse);

        CreateBookingResponse result = bookingService.createBooking(req);

        assertThat(result.getStatus()).isEqualTo(BookingStatus.PENDING);
        assertThat(result.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(150000));
        verify(seatReservationRepository).saveAll(anyList());
        verify(bookingRepository).saveAndFlush(any());
    }

    @Test
    @DisplayName("Tạo booking: không chọn ghế → BOOKING_SEATS_REQUIRED")
    void createBooking_noSeats_throwsError() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setCustomerId("cus-001");
        req.setShowtimeId("screening-1");
        req.setSeatIds(List.of());

        assertThatThrownBy(() -> bookingService.createBooking(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_SEATS_REQUIRED));
    }

    @Test
    @DisplayName("Tạo booking: vượt quá 8 ghế → BOOKING_EXCEED_SEAT_LIMIT")
    void createBooking_exceedSeatLimit_throwsError() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setCustomerId("cus-001");
        req.setShowtimeId("screening-1");
        req.setSeatIds(List.of("s1","s2","s3","s4","s5","s6","s7","s8","s9"));

        assertThatThrownBy(() -> bookingService.createBooking(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_EXCEED_SEAT_LIMIT));
    }

    @Test
    @DisplayName("Tạo booking: screening không ở trạng thái SCHEDULED → SCREENING_NOT_AVAILABLE")
    void createBooking_screeningNotScheduled_throwsError() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setCustomerId("cus-001");
        req.setShowtimeId("screening-1");
        req.setSeatIds(List.of("seat-A1"));

        ShowtimeValidationResponse cancelled = ShowtimeValidationResponse.builder()
                .status("CANCELLED").startTime(LocalDateTime.now().plusDays(1)).build();
        when(catalogClient.validateShowtime("screening-1")).thenReturn(cancelled);

        assertThatThrownBy(() -> bookingService.createBooking(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCREENING_NOT_AVAILABLE));
    }

    @Test
    @DisplayName("Tạo booking: screening đã bắt đầu → SCREENING_ALREADY_STARTED")
    void createBooking_screeningAlreadyStarted_throwsError() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setCustomerId("cus-001");
        req.setShowtimeId("screening-1");
        req.setSeatIds(List.of("seat-A1"));

        ShowtimeValidationResponse past = ShowtimeValidationResponse.builder()
                .status("SCHEDULED").startTime(LocalDateTime.now().minusHours(1)).build();
        when(catalogClient.validateShowtime("screening-1")).thenReturn(past);

        assertThatThrownBy(() -> bookingService.createBooking(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCREENING_ALREADY_STARTED));
    }

    @Test
    @DisplayName("Tạo booking: ghế không tồn tại trong suất chiếu → SCREENING_SEAT_NOT_EXISTED")
    void createBooking_seatNotInShowtime_throwsError() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setCustomerId("cus-001");
        req.setShowtimeId("screening-1");
        req.setSeatIds(List.of("seat-A1", "seat-INVALID"));

        when(catalogClient.validateShowtime("screening-1")).thenReturn(validShowtime);
        when(seatReservationRepository.findByShowtimeIdAndSeatIdIn(any(), any()))
                .thenReturn(List.of(seatA1)); // only 1 found, 2 requested

        assertThatThrownBy(() -> bookingService.createBooking(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCREENING_SEAT_NOT_EXISTED));
    }

    @Test
    @DisplayName("Tạo booking: ghế đã bị LOCKED → SCREENING_SEATS_NOT_AVAILABLE")
    void createBooking_seatAlreadyLocked_throwsError() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setCustomerId("cus-001");
        req.setShowtimeId("screening-1");
        req.setSeatIds(List.of("seat-A1"));

        seatA1.setStatus(SeatReservationStatus.LOCKED);
        when(catalogClient.validateShowtime("screening-1")).thenReturn(validShowtime);
        when(seatReservationRepository.findByShowtimeIdAndSeatIdIn(any(), any()))
                .thenReturn(List.of(seatA1));

        assertThatThrownBy(() -> bookingService.createBooking(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCREENING_SEATS_NOT_AVAILABLE));
    }

    @Test
    @DisplayName("Tạo booking: Redis lock thất bại → SCREENING_SEATS_NOT_AVAILABLE")
    void createBooking_redisLockFail_throwsError() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setCustomerId("cus-001");
        req.setShowtimeId("screening-1");
        req.setSeatIds(List.of("seat-A1", "seat-A2"));

        when(catalogClient.validateShowtime("screening-1")).thenReturn(validShowtime);
        when(seatReservationRepository.findByShowtimeIdAndSeatIdIn(any(), any()))
                .thenReturn(List.of(seatA1, seatA2));
        when(seatLockService.tryLockAll(any(), any(), any())).thenReturn(false);

        assertThatThrownBy(() -> bookingService.createBooking(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCREENING_SEATS_NOT_AVAILABLE));
    }

    // =========================================================
    // CANCEL BOOKING
    // =========================================================

    @Test
    @DisplayName("Hủy booking PENDING thành công: ghế về AVAILABLE, Redis giải phóng")
    void cancelBooking_pendingBooking_success() {
        Booking booking = Booking.builder()
                .customerId("cus-001").showtimeId("screening-1")
                .status(BookingStatus.PENDING)
                .expiredAt(LocalDateTime.now().plusMinutes(5))
                .build();
        booking.setId("booking-1");

        SeatReservation lockedSeat = SeatReservation.builder()
                .seatId("seat-A1").bookingId("booking-1")
                .status(SeatReservationStatus.LOCKED).build();

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(seatReservationRepository.findByBookingId("booking-1")).thenReturn(List.of(lockedSeat));

        bookingService.cancelBooking("booking-1");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(bookingRepository).save(booking);
        verify(seatReservationRepository).releaseAllByBookingId(eq("booking-1"), eq(SeatReservationStatus.AVAILABLE));
        verify(seatLockService).releaseAll(eq("screening-1"), anyList());
    }

    @Test
    @DisplayName("Hủy booking đã CANCELLED → BOOKING_CANNOT_CANCEL")
    void cancelBooking_alreadyCancelled_throwsError() {
        Booking booking = Booking.builder().status(BookingStatus.CANCELLED).build();
        booking.setId("booking-1");
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking("booking-1"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_CANNOT_CANCEL));
    }

    @Test
    @DisplayName("Hủy booking đã EXPIRED → BOOKING_CANNOT_CANCEL")
    void cancelBooking_expired_throwsError() {
        Booking booking = Booking.builder().status(BookingStatus.EXPIRED).build();
        booking.setId("booking-1");
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking("booking-1"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_CANNOT_CANCEL));
    }

    @Test
    @DisplayName("Hủy booking không tồn tại → BOOKING_NOT_EXISTED")
    void cancelBooking_notFound_throwsError() {
        when(bookingRepository.findById("not-exist")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.cancelBooking("not-exist"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_NOT_EXISTED));
    }

    // =========================================================
    // CONFIRM BOOKING
    // =========================================================

    @Test
    @DisplayName("Confirm booking PENDING thành công: CONFIRMED, tạo tickets, giải phóng Redis")
    void confirmBooking_success() {
        Booking booking = Booking.builder()
                .showtimeId("screening-1")
                .status(BookingStatus.PENDING)
                .expiredAt(LocalDateTime.now().plusMinutes(5))
                .build();
        booking.setId("booking-1");

        SeatReservation lockedSeat = SeatReservation.builder()
                .seatId("seat-A1").status(SeatReservationStatus.LOCKED).build();

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(seatReservationRepository.findByBookingId("booking-1")).thenReturn(List.of(lockedSeat));

        bookingService.confirmBooking("booking-1");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        verify(seatReservationRepository).confirmByBookingId(eq("booking-1"), eq(SeatReservationStatus.BOOKED));
        verify(seatLockService).releaseAll(eq("screening-1"), anyList());
        verify(ticketService).createTickets("booking-1");
        verify(bookingRepository).save(booking);
    }

    @Test
    @DisplayName("Confirm booking không phải PENDING → BOOKING_CANNOT_CONFIRM")
    void confirmBooking_notPending_throwsError() {
        Booking booking = Booking.builder().status(BookingStatus.CONFIRMED).build();
        booking.setId("booking-1");
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.confirmBooking("booking-1"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_CANNOT_CONFIRM));
    }

    @Test
    @DisplayName("Confirm booking đã hết hạn 10 phút → BOOKING_EXPIRED")
    void confirmBooking_expired_throwsError() {
        Booking booking = Booking.builder()
                .status(BookingStatus.PENDING)
                .expiredAt(LocalDateTime.now().minusMinutes(1))
                .build();
        booking.setId("booking-1");
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.confirmBooking("booking-1"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_EXPIRED));
    }
}
