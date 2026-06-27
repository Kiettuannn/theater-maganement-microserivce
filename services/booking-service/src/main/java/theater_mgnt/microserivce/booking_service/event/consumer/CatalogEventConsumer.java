package theater_mgnt.microserivce.booking_service.event.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.event.dto.ShowtimeCancelledEvent;
import theater_mgnt.microserivce.booking_service.event.dto.ShowtimeCreatedEvent;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;
import theater_mgnt.microserivce.booking_service.seatReservation.service.SeatLockService;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;
import theater_mgnt.microserivce.booking_service.ticket.repository.TicketRepository;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogEventConsumer {

    private final SeatReservationRepository seatReservationRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final SeatLockService seatLockService;

    /**
     * ShowtimeCreated — spec §10.1 (Option A: pre-populate)
     * Creates one SeatReservation row per seat with status=AVAILABLE.
     * booking_id is null at this stage; it is set when a customer books.
     * Idempotent: skips seats that already have a reservation row (ON CONFLICT DO NOTHING).
     */
    @KafkaListener(
            topics = "cinema.catalog.showtime-created",
            groupId = "booking-service",
            containerFactory = "showtimeCreatedKafkaListenerContainerFactory")
    @Transactional
    public void onShowtimeCreated(ShowtimeCreatedEvent event) {
        if (event.getSeats() == null || event.getSeats().isEmpty()) {
            log.warn("ShowtimeCreated event for showtime {} has no seats — skipping", event.getShowtimeId());
            return;
        }

        // Parse startTime and endTime from ISO-8601 strings
        Instant startTime = null;
        Instant endTime = null;
        try {
            startTime = Instant.parse(event.getStartTime());
        } catch (Exception ex) {
            log.warn("Could not parse startTime '{}' for showtime {}", event.getStartTime(), event.getShowtimeId());
        }
        try {
            endTime = Instant.parse(event.getEndTime());
        } catch (Exception ex) {
            log.warn("Could not parse endTime '{}' for showtime {} — ticket expiresAt will fall back to now+3h",
                    event.getEndTime(), event.getShowtimeId());
        }

        final Instant showtimeStartTime = startTime;
        final Instant showtimeEndTime = endTime;

        List<SeatReservation> toSave = event.getSeats().stream()
                .filter(seat -> !seatReservationRepository
                        .existsByShowtimeIdAndSeatId(event.getShowtimeId(), seat.getSeatId()))
                .map(seat -> SeatReservation.builder()
                        .showtimeId(event.getShowtimeId())
                        .roomId(event.getRoomId())
                        .seatId(seat.getSeatId())
                        .rowLabel(seat.getRowLabel())
                        .seatNumber(seat.getSeatNumber())
                        .seatType(seat.getSeatType())
                        .price(seat.getPrice())
                        .status(SeatReservationStatus.AVAILABLE)
                        .showtimeStartTime(showtimeStartTime)
                        .showtimeEndTime(showtimeEndTime)
                        .build())
                .toList();

        if (!toSave.isEmpty()) {
            seatReservationRepository.saveAll(toSave);
            log.info("ShowtimeCreated: pre-populated {} seat reservations for showtime {}",
                    toSave.size(), event.getShowtimeId());
        } else {
            log.info("ShowtimeCreated: all {} seats for showtime {} already exist — skipping",
                    event.getSeats().size(), event.getShowtimeId());
        }
    }

    /**
     * ShowtimeCancelled — spec §10.1
     * Cancel all INITIATED/PAYMENT_PENDING bookings; mark seat_reservations CANCELLED; clear Redis.
     */
    @KafkaListener(
            topics = "cinema.catalog.showtime-cancelled",
            groupId = "booking-service",
            containerFactory = "showtimeCancelledKafkaListenerContainerFactory")
    @Transactional
    public void onShowtimeCancelled(ShowtimeCancelledEvent event) {
        log.info("ShowtimeCancelled event received for showtime: {}", event.getShowtimeId());

        List<Booking> activeBookings = bookingRepository.findActiveBookingsByShowtimeId(
                event.getShowtimeId(),
                List.of(BookingStatus.INITIATED, BookingStatus.PAYMENT_PENDING, BookingStatus.CONFIRMED));

        Instant now = Instant.now();

        for (Booking booking : activeBookings) {
            boolean wasConfirmed = booking.getStatus() == BookingStatus.CONFIRMED;
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledAt(now);
            booking.setCancellationReason("SHOWTIME_CANCELLED");

            List<SeatReservation> seats = seatReservationRepository.findByBookingId(booking.getId());
            seatReservationRepository.cancelByBookingId(booking.getId(), now);
            seatLockService.releaseAll(booking.getShowtimeId(),
                    seats.stream().map(SeatReservation::getSeatId).toList());

            if (wasConfirmed) {
                ticketRepository.findByBookingIdAndStatus(booking.getId(), TicketStatus.ACTIVE)
                        .forEach(t -> t.setStatus(TicketStatus.CANCELLED));
            }
        }

        bookingRepository.saveAll(activeBookings);

        // Cancel all remaining seat reservations for this showtime (any status)
        seatReservationRepository.cancelAllByShowtimeId(event.getShowtimeId());

        log.info("Cancelled {} bookings for showtime {}", activeBookings.size(), event.getShowtimeId());
    }
}
