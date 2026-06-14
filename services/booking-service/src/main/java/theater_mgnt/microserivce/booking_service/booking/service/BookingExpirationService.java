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
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;
import theater_mgnt.microserivce.booking_service.seatReservation.service.SeatLockService;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpirationService {

    private final BookingRepository bookingRepository;
    private final SeatReservationRepository seatReservationRepository;
    private final SeatLockService seatLockService;

    @Scheduled(fixedDelay = 10_000)
    @Transactional
    public void expireBookings() {
        List<Booking> expired = bookingRepository.findExpiredPendingBookings(
                LocalDateTime.now(), BookingStatus.PENDING);
        if (expired.isEmpty()) return;

        log.info("Expiring {} bookings", expired.size());

        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.EXPIRED);
            List<SeatReservation> seats = seatReservationRepository.findByBookingId(booking.getId());
            seatReservationRepository.releaseByBookingId(
                    booking.getId(),
                    SeatReservationStatus.AVAILABLE,
                    SeatReservationStatus.LOCKED
            );
            // Redis keys sẽ tự expire theo TTL, nhưng cleanup sớm hơn:
            seatLockService.releaseAll(booking.getShowtimeId(),
                    seats.stream().map(SeatReservation::getSeatId).toList());
        }

        bookingRepository.saveAll(expired);
    }
}
