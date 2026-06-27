package theater_mgnt.microserivce.booking_service.ticket.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.response.ComboCheckInResponse;
import theater_mgnt.microserivce.booking_service.bookingCombo.service.BookingComboService;
import theater_mgnt.microserivce.booking_service.common.exception.AppException;
import theater_mgnt.microserivce.booking_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;
import theater_mgnt.microserivce.booking_service.ticket.dto.request.TicketCheckInRequest;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketCheckInViewResponse;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketResponse;
import theater_mgnt.microserivce.booking_service.ticket.entity.Ticket;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;
import theater_mgnt.microserivce.booking_service.ticket.mapper.TicketMapper;
import theater_mgnt.microserivce.booking_service.ticket.repository.TicketRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final BookingRepository bookingRepository;
    private final SeatReservationRepository seatReservationRepository;
    private final BookingComboService bookingComboService;
    private final TicketMapper ticketMapper;
    private final TicketCodeGenerator ticketCodeGenerator;
    private final QrGenerator qrGenerator;

    @Override
    public List<TicketResponse> getTicketsByBooking(String bookingId) {
        return ticketRepository.findByBookingId(bookingId).stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    public List<TicketResponse> getTicketsByUserId(String userId) {
        // Resolve all bookings for user, then fetch tickets
        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<String> bookingIds = bookings.stream().map(Booking::getId).toList();
        return ticketRepository.findByBookingIdIn(bookingIds).stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    public TicketResponse getTicketByCode(String ticketCode) {
        return ticketMapper.toResponse(findTicketOrThrow(ticketCode));
    }

    @Override
    public TicketCheckInViewResponse getTicketCheckInViewByCode(String ticketCode) {
        Ticket ticket = findTicketOrThrow(ticketCode);
        List<ComboCheckInResponse> combos = bookingComboService.getCombos(ticket.getBookingId());
        return new TicketCheckInViewResponse(ticketMapper.toResponse(ticket), combos);
    }

    @Override
    public void createTickets(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppException(ErrorCode.BOOKING_CANNOT_CONFIRM);
        }

        List<SeatReservation> seats = seatReservationRepository.findByBookingId(bookingId);

        // H7: use showtimeEndTime snapshotted from ShowtimeCreated event.
        // Fall back to now+3h only if not available (e.g. legacy rows without endTime).
        Instant fallbackExpiry = Instant.now().plus(3, ChronoUnit.HOURS);

        List<Ticket> tickets = seats.stream()
                .map(seat -> {
                    Instant expiresAt = seat.getShowtimeEndTime() != null
                            ? seat.getShowtimeEndTime()
                            : fallbackExpiry;
                    String code = generateUniqueCode();
                    return Ticket.builder()
                            .bookingId(bookingId)
                            .seatReservationId(seat.getId())
                            .seatName(seat.getRowLabel() + seat.getSeatNumber())
                            .price(seat.getPrice())
                            .ticketCode(code)
                            .qrContent(qrGenerator.generateQrContent(code))
                            .status(TicketStatus.ACTIVE)
                            .expiresAt(expiresAt)
                            .build();
                })
                .toList();

        ticketRepository.saveAll(tickets);
        log.info("Created {} tickets for booking {}", tickets.size(), bookingId);
    }

    @Override
    public void checkInTicket(TicketCheckInRequest request) {
        Ticket ticket = findTicketOrThrow(request.getTicketCode());
        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new AppException(ErrorCode.TICKET_NOT_ACTIVE);
        }
        if (Instant.now().isAfter(ticket.getExpiresAt())) {
            ticket.setStatus(TicketStatus.EXPIRED);
            ticketRepository.save(ticket);
            throw new AppException(ErrorCode.TICKET_EXPIRED);
        }
        ticket.setStatus(TicketStatus.USED);
        ticket.setUsedAt(Instant.now());
        ticketRepository.save(ticket);
    }

    @Override
    public void markForTransfer(String ticketCode) {
        Ticket ticket = findTicketOrThrow(ticketCode);
        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new AppException(ErrorCode.TICKET_NOT_ACTIVE);
        }
        ticket.setStatus(TicketStatus.FOR_TRANSFER);
        ticketRepository.save(ticket);
        log.info("Ticket {} marked FOR_TRANSFER", ticketCode);
    }

    @Override
    public void cancelTransfer(String ticketCode) {
        Ticket ticket = findTicketOrThrow(ticketCode);
        if (ticket.getStatus() != TicketStatus.FOR_TRANSFER) {
            throw new AppException(ErrorCode.TICKET_NOT_ACTIVE);
        }
        ticket.setStatus(TicketStatus.ACTIVE);
        ticketRepository.save(ticket);
        log.info("Ticket {} transfer cancelled, back to ACTIVE", ticketCode);
    }

    @Override
    public void expireTickets() {
        List<Ticket> expired = ticketRepository.findAllByStatusAndExpiresAtBefore(
                TicketStatus.ACTIVE, Instant.now());
        if (expired.isEmpty()) return;
        expired.forEach(t -> t.setStatus(TicketStatus.EXPIRED));
        ticketRepository.saveAll(expired);
        log.info("Expired {} tickets", expired.size());
    }

    // ────────────────────────────────────────────────────────────────────────
    private Ticket findTicketOrThrow(String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = ticketCodeGenerator.generate();
        } while (ticketRepository.existsByTicketCode(code));
        return code;
    }
}
