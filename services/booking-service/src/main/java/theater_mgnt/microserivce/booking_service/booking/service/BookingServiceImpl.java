package theater_mgnt.microserivce.booking_service.booking.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.booking_service.booking.dto.request.CreateBookingRequest;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingListItemResponse;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingListResponse;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingSummaryResponse;
import theater_mgnt.microserivce.booking_service.booking.dto.response.CreateBookingResponse;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.mapper.BookingMapper;
import theater_mgnt.microserivce.booking_service.booking.mapper.BookingSummaryMapper;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.bookingCombo.entity.BookingCombo;
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

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final BookingComboRepository bookingComboRepository;
    private final SeatReservationRepository seatReservationRepository;
    private final TicketRepository ticketRepository;
    private final BookingMapper bookingMapper;
    private final BookingSummaryMapper bookingSummaryMapper;
    private final TicketService ticketService;
    private final CatalogClient catalogClient;
    private final SeatLockService seatLockService;

    private static final int MAX_SEATS_PER_BOOKING = 8;
    private static final int HOLD_MINUTES = 10;

    @Override
    public CreateBookingResponse createBooking(CreateBookingRequest request) {
        if (request.getSeatIds() == null || request.getSeatIds().isEmpty()) {
            throw new AppException(ErrorCode.BOOKING_SEATS_REQUIRED);
        }
        if (request.getSeatIds().size() > MAX_SEATS_PER_BOOKING) {
            throw new AppException(ErrorCode.BOOKING_EXCEED_SEAT_LIMIT);
        }

        ShowtimeValidationResponse showtime = catalogClient.validateShowtime(request.getShowtimeId());
        if (!"SCHEDULED".equals(showtime.getStatus())) {
            throw new AppException(ErrorCode.SCREENING_NOT_AVAILABLE);
        }
        if (showtime.getStartTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.SCREENING_ALREADY_STARTED);
        }

        // Eager: SeatReservation đã tồn tại với price cố định từ lúc tạo screening
        List<SeatReservation> targetSeats = seatReservationRepository
                .findByShowtimeIdAndSeatIdIn(request.getShowtimeId(), request.getSeatIds());

        if (targetSeats.size() != request.getSeatIds().size()) {
            throw new AppException(ErrorCode.SCREENING_SEAT_NOT_EXISTED);
        }

        boolean anyUnavailable = targetSeats.stream()
                .anyMatch(r -> r.getStatus() != SeatReservationStatus.AVAILABLE);
        if (anyUnavailable) {
            throw new AppException(ErrorCode.SCREENING_SEATS_NOT_AVAILABLE);
        }

        // Redis SETNX atomic lock
        String tempLockId = "pending-" + System.currentTimeMillis();
        boolean locked = seatLockService.tryLockAll(request.getShowtimeId(), request.getSeatIds(), tempLockId);
        if (!locked) {
            throw new AppException(ErrorCode.SCREENING_SEATS_NOT_AVAILABLE);
        }

        LocalDateTime expiredAt = LocalDateTime.now().plusMinutes(HOLD_MINUTES);

        BigDecimal totalAmount = targetSeats.stream()
                .map(SeatReservation::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Booking booking = Booking.builder()
                .customerId(request.getCustomerId())
                .showtimeId(request.getShowtimeId())
                .showtimeTitle(showtime.getMovieTitle())
                .showtimeStartTime(showtime.getStartTime())
                .status(BookingStatus.PENDING)
                .totalAmount(totalAmount)
                .expiredAt(expiredAt)
                .build();
        bookingRepository.saveAndFlush(booking);

        // AVAILABLE → LOCKED
        targetSeats.forEach(seat -> {
            seat.setStatus(SeatReservationStatus.LOCKED);
            seat.setBookingId(booking.getId());
            seat.setLockUntil(expiredAt);
        });
        seatReservationRepository.saveAll(targetSeats);

        log.info("Booking {} created for customer {} showtime {}", booking.getId(), request.getCustomerId(), request.getShowtimeId());
        return bookingMapper.toCreateBookingResponse(booking);
    }

    @Override
    public BookingSummaryResponse getBookingSummary(String bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
        List<SeatReservation> seats = seatReservationRepository.findByBookingId(bookingId);
        List<BookingCombo> combos = bookingComboRepository.findByBookingId(bookingId);
        return bookingSummaryMapper.toSummaryResponse(booking, seats, combos);
    }

    @Override
    public void cancelBooking(String bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() == BookingStatus.EXPIRED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new AppException(ErrorCode.BOOKING_CANNOT_CANCEL);
        }

        boolean wasConfirmed = booking.getStatus() == BookingStatus.CONFIRMED;
        List<SeatReservation> seats = seatReservationRepository.findByBookingId(bookingId);
        List<String> seatIds = seats.stream().map(SeatReservation::getSeatId).toList();

        booking.setStatus(BookingStatus.CANCELLED);
        seatReservationRepository.releaseAllByBookingId(bookingId, SeatReservationStatus.AVAILABLE);
        seatLockService.releaseAll(booking.getShowtimeId(), seatIds);

        if (wasConfirmed) {
            ticketRepository.findByBooking_IdAndStatus(bookingId, TicketStatus.ACTIVE)
                    .forEach(t -> t.setStatus(TicketStatus.CANCELLED));
        }

        bookingRepository.save(booking);
        log.info("Booking {} cancelled", bookingId);
    }

    @Override
    public void confirmBooking(String bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(ErrorCode.BOOKING_CANNOT_CONFIRM);
        }
        if (booking.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.BOOKING_EXPIRED);
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        seatReservationRepository.confirmByBookingId(bookingId, SeatReservationStatus.BOOKED);

        List<SeatReservation> seats = seatReservationRepository.findByBookingId(bookingId);
        seatLockService.releaseAll(booking.getShowtimeId(),
                seats.stream().map(SeatReservation::getSeatId).toList());

        ticketService.createTickets(bookingId);
        bookingRepository.save(booking);
        log.info("Booking {} confirmed", bookingId);
    }

    @Override
    public BookingListResponse getBookings(BookingStatus status, String customerId, String showtimeId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findBookings(status, customerId, showtimeId, pageable);
        List<BookingListItemResponse> items = page.getContent().stream()
                .map(this::toListItem)
                .toList();
        return BookingListResponse.builder()
                .bookings(items)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .build();
    }

    private BookingListItemResponse toListItem(Booking b) {
        long seatCount = seatReservationRepository.countByBookingId(b.getId());
        return BookingListItemResponse.builder()
                .id(b.getId())
                .customerId(b.getCustomerId())
                .showtimeId(b.getShowtimeId())
                .showtimeTitle(b.getShowtimeTitle())
                .showtimeStartTime(b.getShowtimeStartTime())
                .seatCount((int) seatCount)
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .expiredAt(b.getExpiredAt())
                .build();
    }

    private Booking findBookingOrThrow(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));
    }
}
