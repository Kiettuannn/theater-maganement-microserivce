package theater_mgnt.microserivce.booking_service.booking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
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
import theater_mgnt.microserivce.booking_service.common.exception.AppException;
import theater_mgnt.microserivce.booking_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.booking_service.idempotency.dto.IdempotencyCheckResult;
import theater_mgnt.microserivce.booking_service.idempotency.service.IdempotencyService;
import theater_mgnt.microserivce.booking_service.outbox.service.OutboxRelayService;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;
import theater_mgnt.microserivce.booking_service.seatReservation.service.SeatLockService;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;
import theater_mgnt.microserivce.booking_service.ticket.repository.TicketRepository;
import theater_mgnt.microserivce.booking_service.ticket.service.TicketService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

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
    private final SeatLockService seatLockService;
    private final IdempotencyService idempotencyService;
    private final OutboxRelayService outboxRelayService;
    private final ObjectMapper objectMapper;

    private static final int MAX_SEATS_PER_BOOKING = 8;
    private static final int HOLD_MINUTES = 8;

    // ─── Kafka topics ─────────────────────────────────────────────────────────
    private static final String TOPIC_BOOKING_CREATED   = "cinema.booking.booking-created";
    private static final String TOPIC_TICKET_ISSUED     = "cinema.booking.ticket-issued";
    private static final String TOPIC_BOOKING_CONFIRMED = "cinema.booking.booking-confirmed";

    @Override
    public CreateBookingResponse createBooking(CreateBookingRequest request) {
        // ── H5: Idempotency check ──────────────────────────────────────────────
        String requestJson = toJson(request);
        if (request.getIdempotencyKey() != null) {
            IdempotencyCheckResult idem = idempotencyService.check(
                    request.getIdempotencyKey().toString(),
                    request.getUserId(),
                    requestJson);
            if (idem.isDuplicate()) {
                // Exact duplicate — re-fetch and return original booking
                log.info("Idempotent replay for key {}", request.getIdempotencyKey());
                Booking existing = findBookingOrThrow(idem.getBookingId());
                return bookingMapper.toCreateBookingResponse(existing);
            }
        }

        // ── Validate seat count ────────────────────────────────────────────────
        if (request.getSeatReservationIds() == null || request.getSeatReservationIds().isEmpty()) {
            throw new AppException(ErrorCode.BOOKING_SEATS_REQUIRED);
        }
        if (request.getSeatReservationIds().size() > MAX_SEATS_PER_BOOKING) {
            throw new AppException(ErrorCode.BOOKING_EXCEED_SEAT_LIMIT);
        }

        // ── Load seat reservations and validate they are AVAILABLE ─────────────
        List<SeatReservation> targetSeats = seatReservationRepository
                .findAllById(request.getSeatReservationIds());

        if (targetSeats.size() != request.getSeatReservationIds().size()) {
            throw new AppException(ErrorCode.SCREENING_SEAT_NOT_EXISTED);
        }

        boolean anyUnavailable = targetSeats.stream()
                .anyMatch(r -> r.getStatus() != SeatReservationStatus.AVAILABLE);
        if (anyUnavailable) {
            throw new AppException(ErrorCode.SHOWTIME_SEATS_NOT_AVAILABLE);
        }

        // ── Redis SETNX atomic lock (all-or-nothing) ───────────────────────────
        String showtimeId = targetSeats.get(0).getShowtimeId();
        List<String> seatIds = targetSeats.stream().map(SeatReservation::getSeatId).toList();
        String lockHolderId = request.getUserId() != null ? request.getUserId() : "anon";
        boolean locked = seatLockService.tryLockAll(showtimeId, seatIds, lockHolderId);
        if (!locked) {
            throw new AppException(ErrorCode.SEAT_ALREADY_LOCKED);
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(HOLD_MINUTES * 60L);

        // ── Calculate total ────────────────────────────────────────────────────
        BigDecimal totalAmount = targetSeats.stream()
                .map(SeatReservation::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String currency = request.getCurrency() != null ? request.getCurrency() : "VND";
        String idempotencyKey = request.getIdempotencyKey() != null
                ? request.getIdempotencyKey().toString() : java.util.UUID.randomUUID().toString();

        // ── C2: roomId từ seat (đã được snapshotted từ ShowtimeCreated event) ──
        String roomId = targetSeats.get(0).getRoomId();

        // ── M9: showtimeDate from seat.showtimeStartTime (snapshotted from ShowtimeCreated event) ──
        Instant startTime = targetSeats.get(0).getShowtimeStartTime();
        Instant endTime   = targetSeats.get(0).getShowtimeEndTime();
        LocalDate showtimeDate = startTime != null
                ? startTime.atZone(ZoneOffset.UTC).toLocalDate()
                : endTime != null
                        ? endTime.atZone(ZoneOffset.UTC).toLocalDate()
                        : LocalDate.now(ZoneOffset.UTC);

        // ── Persist booking (INITIATED) ────────────────────────────────────────
        Booking booking = Booking.builder()
                .userId(request.getUserId())
                .showtimeId(showtimeId)
                .roomId(roomId)
                .showtimeDate(showtimeDate)
                .status(BookingStatus.INITIATED)
                .totalAmount(totalAmount)
                .currency(currency)
                .idempotencyKey(idempotencyKey)
                .expiresAt(expiresAt)
                .build();
        booking = bookingRepository.saveAndFlush(booking);

        // ── H6: Atomic lock seats + set booking_id in ONE query ───────────────
        int updated = seatReservationRepository.lockSeatsForBooking(
                request.getSeatReservationIds(), now, booking.getId());
        if (updated != request.getSeatReservationIds().size()) {
            // Rollback Redis locks
            seatLockService.releaseAll(showtimeId, seatIds);
            throw new AppException(ErrorCode.SHOWTIME_SEATS_NOT_AVAILABLE);
        }

        // ── H4: Write BookingCreated outbox record (same transaction) ─────────
        outboxRelayService.save(
                "Booking",
                booking.getId(),
                "booking.created",
                buildBookingCreatedPayload(booking, targetSeats),
                TOPIC_BOOKING_CREATED,
                showtimeId);

        // ── H5: Store idempotency record (same transaction) ───────────────────
        if (request.getIdempotencyKey() != null) {
            CreateBookingResponse response = bookingMapper.toCreateBookingResponse(booking);
            idempotencyService.store(
                    request.getIdempotencyKey().toString(),
                    request.getUserId(),
                    requestJson,
                    booking.getId(),
                    200,
                    toJson(response));
        }

        log.info("Booking {} INITIATED for user {} showtime {}", booking.getId(), request.getUserId(), showtimeId);
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
        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.FAILED
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new AppException(ErrorCode.BOOKING_CANNOT_CANCEL);
        }

        boolean wasConfirmed = booking.getStatus() == BookingStatus.CONFIRMED;
        List<SeatReservation> seats = seatReservationRepository.findByBookingId(bookingId);
        List<String> seatIdList = seats.stream().map(SeatReservation::getSeatId).toList();

        Instant now = Instant.now();
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(now);
        seatReservationRepository.cancelByBookingId(bookingId, now);
        seatLockService.releaseAll(booking.getShowtimeId(), seatIdList);

        if (wasConfirmed) {
            ticketRepository.findByBookingIdAndStatus(bookingId, TicketStatus.ACTIVE)
                    .forEach(t -> t.setStatus(TicketStatus.CANCELLED));
        }

        bookingRepository.save(booking);
        log.info("Booking {} CANCELLED", bookingId);
    }

    @Override
    public void confirmBooking(String bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.INITIATED
                && booking.getStatus() != BookingStatus.PAYMENT_PENDING) {
            throw new AppException(ErrorCode.BOOKING_CANNOT_CONFIRM);
        }
        if (booking.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.BOOKING_EXPIRED);
        }

        Instant now = Instant.now();
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(now);
        seatReservationRepository.confirmByBookingId(bookingId, now);

        List<SeatReservation> seats = seatReservationRepository.findByBookingId(bookingId);
        seatLockService.releaseAll(booking.getShowtimeId(),
                seats.stream().map(SeatReservation::getSeatId).toList());

        // Create tickets
        ticketService.createTickets(bookingId);

        bookingRepository.save(booking);

        // ── H4: Write TicketIssued + BookingConfirmed outbox records ─────────
        outboxRelayService.save(
                "Booking",
                bookingId,
                "ticket.issued",
                buildTicketIssuedPayload(booking),
                TOPIC_TICKET_ISSUED,
                booking.getShowtimeId());

        outboxRelayService.save(
                "Booking",
                bookingId,
                "booking.confirmed",
                buildBookingConfirmedPayload(booking, seats),
                TOPIC_BOOKING_CONFIRMED,
                booking.getShowtimeId());

        log.info("Booking {} CONFIRMED", bookingId);
    }

    @Override
    public BookingListResponse getBookings(BookingStatus status, String userId, String showtimeId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findBookings(status, userId, showtimeId, pageable);
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

    // ── Private helpers ────────────────────────────────────────────────────────

    private BookingListItemResponse toListItem(Booking b) {
        long seatCount = seatReservationRepository.countByBookingId(b.getId());
        return BookingListItemResponse.builder()
                .id(b.getId())
                .bookingCode(b.getBookingCode())
                .userId(b.getUserId())
                .showtimeId(b.getShowtimeId())
                .seatCount((int) seatCount)
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt() != null ? b.getCreatedAt().toInstant(ZoneOffset.UTC) : null)
                .expiresAt(b.getExpiresAt())
                .build();
    }

    private Booking findBookingOrThrow(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));
    }

    @SneakyThrows
    private String toJson(Object obj) {
        return objectMapper.writeValueAsString(obj);
    }

    // ── Outbox payload builders ────────────────────────────────────────────────

    @SneakyThrows
    private String buildBookingCreatedPayload(Booking booking, List<SeatReservation> seats) {
        var seatsData = seats.stream()
                .map(s -> {
                    java.util.Map<String, Object> seatMap = new java.util.HashMap<>();
                    seatMap.put("seatReservationId", s.getId());
                    seatMap.put("seatName", (s.getRowLabel() != null ? s.getRowLabel() : "") + (s.getSeatNumber() != null ? s.getSeatNumber() : ""));
                    seatMap.put("price", s.getPrice());
                    return seatMap;
                })
                .toList();
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("bookingId",   booking.getId());
        payload.put("bookingCode", booking.getBookingCode());
        payload.put("userId",      String.valueOf(booking.getUserId()));
        payload.put("showtimeId",  booking.getShowtimeId());
        payload.put("totalAmount", booking.getTotalAmount());
        payload.put("expiresAt",   booking.getExpiresAt() != null ? booking.getExpiresAt().toString() : null);
        payload.put("seats",       seatsData);
        java.util.Map<String, Object> wrapper = new java.util.HashMap<>();
        wrapper.put("eventType",  "BookingCreated");
        wrapper.put("occurredAt", Instant.now().toString());
        wrapper.put("payload",    payload);
        return objectMapper.writeValueAsString(wrapper);
    }

    @SneakyThrows
    private String buildTicketIssuedPayload(Booking booking) {
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("bookingId",  booking.getId());
        payload.put("userId",     String.valueOf(booking.getUserId()));
        payload.put("showtimeId", booking.getShowtimeId());
        java.util.Map<String, Object> wrapper = new java.util.HashMap<>();
        wrapper.put("eventType",  "TicketIssued");
        wrapper.put("occurredAt", Instant.now().toString());
        wrapper.put("payload",    payload);
        return objectMapper.writeValueAsString(wrapper);
    }

    @SneakyThrows
    private String buildBookingConfirmedPayload(Booking booking, List<SeatReservation> seats) {
        BigDecimal ticketRevenue = seats.stream()
                .map(SeatReservation::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("bookingId",        booking.getId());
        payload.put("userId",           String.valueOf(booking.getUserId()));
        payload.put("showtimeId",       booking.getShowtimeId());
        payload.put("confirmedAt",      booking.getConfirmedAt() != null ? booking.getConfirmedAt().toString() : "");
        payload.put("ticketRevenue",    ticketRevenue);
        payload.put("totalAmount",      booking.getTotalAmount());
        payload.put("totalTicketsSold", seats.size());
        payload.put("showtimeDate",     booking.getShowtimeDate() != null ? booking.getShowtimeDate().toString() : "");
        java.util.Map<String, Object> wrapper = new java.util.HashMap<>();
        wrapper.put("eventType",  "BookingConfirmed");
        wrapper.put("occurredAt", Instant.now().toString());
        wrapper.put("payload",    payload);
        return objectMapper.writeValueAsString(wrapper);
    }
}
