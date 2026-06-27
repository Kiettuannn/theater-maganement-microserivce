package theater_mgnt.microserivce.booking_service.booking.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;
import theater_mgnt.microserivce.booking_service.seatReservation.service.SeatLockService;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpirationService {

    private final BookingRepository bookingRepository;
    private final SeatReservationRepository seatReservationRepository;
    private final SeatLockService seatLockService;

    /** Runs every 10 s — finds INITIATED bookings past expiresAt and transitions them to FAILED */
    @Scheduled(fixedDelay = 10_000)
    @Transactional
    public void expireBookings() {
        List<Booking> expired = bookingRepository.findExpiredInitiatedBookings(Instant.now());
        if (expired.isEmpty()) return;

        log.info("Expiring {} INITIATED bookings past expiresAt", expired.size());
        Instant now = Instant.now();

        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.FAILED);
            List<SeatReservation> seats = seatReservationRepository.findByBookingId(booking.getId());
            // Release LOCKED seats → AVAILABLE
            seatReservationRepository.releaseLockedByBookingId(booking.getId(), now);
            // Redis keys have their own TTL but clean up early for good hygiene
            seatLockService.releaseAll(booking.getShowtimeId(),
                    seats.stream().map(SeatReservation::getSeatId).toList());
        }

        bookingRepository.saveAll(expired);
    }
}
