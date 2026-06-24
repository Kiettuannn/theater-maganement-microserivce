package theater_mgnt.microserivce.booking_service.event.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.event.dto.ScreeningCancelledEvent;
import theater_mgnt.microserivce.booking_service.event.dto.ScreeningCreatedEvent;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;
import theater_mgnt.microserivce.booking_service.seatReservation.service.SeatLockService;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;
import theater_mgnt.microserivce.booking_service.ticket.repository.TicketRepository;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogEventConsumer {

    private final SeatReservationRepository seatReservationRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final SeatLockService seatLockService;

    @KafkaListener(topics = "catalog.screening.created", groupId = "booking-service")
    @Transactional
    public void onScreeningCreated(ScreeningCreatedEvent event) {
        log.info("Received screening.created event for screening: {} ({} seats)",
                event.getScreeningId(), event.getSeats().size());

        List<SeatReservation> reservations = event.getSeats().stream()
                .map(seat -> SeatReservation.builder()
                        .showtimeId(event.getScreeningId())
                        .seatId(seat.getSeatId())
                        .rowChair(seat.getRowChair())
                        .seatNumber(seat.getSeatNumber())
                        .seatTypeId(seat.getSeatTypeId())
                        .seatTypeName(seat.getSeatTypeName())
                        .price(seat.getPrice())
                        .status(SeatReservationStatus.AVAILABLE)
                        .build())
                .toList();

        seatReservationRepository.saveAll(reservations);
        log.info("Created {} AVAILABLE seat reservations for screening {}", reservations.size(), event.getScreeningId());
    }

    @KafkaListener(topics = "catalog.screening.cancelled", groupId = "booking-service")
    @Transactional
    public void onScreeningCancelled(ScreeningCancelledEvent event) {
        log.info("Received screening.cancelled event for screening: {}", event.getScreeningId());

        List<Booking> activeBookings = bookingRepository.findActiveBookingsByShowtimeId(
                event.getScreeningId(), List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED));

        for (Booking booking : activeBookings) {
            if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.EXPIRED) {
                continue;
            }
            boolean wasConfirmed = booking.getStatus() == BookingStatus.CONFIRMED;
            booking.setStatus(BookingStatus.CANCELLED);

            List<SeatReservation> seats = seatReservationRepository.findByBookingId(booking.getId());
            seatReservationRepository.releaseAllByBookingId(booking.getId(), SeatReservationStatus.AVAILABLE);
            seatLockService.releaseAll(booking.getShowtimeId(),
                    seats.stream().map(SeatReservation::getSeatId).toList());

            if (wasConfirmed) {
                ticketRepository.findByBooking_IdAndStatus(booking.getId(), TicketStatus.ACTIVE)
                        .forEach(t -> t.setStatus(TicketStatus.CANCELLED));
            }
        }

        bookingRepository.saveAll(activeBookings);

        // Cleanup all SeatReservation for this screening
        seatReservationRepository.deleteByShowtimeId(event.getScreeningId());

        log.info("Cancelled {} bookings and cleaned up SeatReservations for screening {}",
                activeBookings.size(), event.getScreeningId());
    }
}
