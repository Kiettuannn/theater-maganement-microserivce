package theater_mgnt.microserivce.booking_service.seatReservation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * On startup: sync Redis seat locks with the DB.
 *
 * Problem: If booking-service or Redis restarts while bookings are in-flight,
 * Redis may have stale locks for seats that are already AVAILABLE in DB
 * (because cancel/expiry called redisTemplate.delete() while Redis was down).
 *
 * Fix: For every seat that is AVAILABLE in DB, delete its Redis lock key.
 * Runs once after ApplicationReadyEvent (after DB + Redis connections are up).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisStartupSyncService {

    private final SeatReservationRepository seatReservationRepository;
    private final SeatLockService seatLockService;

    @EventListener(ApplicationReadyEvent.class)
    public void syncRedisWithDb() {
        log.info("[Startup] Syncing Redis seat locks with DB...");

        try {
            // Load all AVAILABLE seat reservations from DB
            List<SeatReservation> availableSeats = seatReservationRepository
                    .findByStatus(SeatReservationStatus.AVAILABLE);

            if (availableSeats.isEmpty()) {
                log.info("[Startup] No AVAILABLE seats found — nothing to sync.");
                return;
            }

            // Group by showtimeId for efficient Redis pattern delete
            Map<String, List<SeatReservation>> byShowtime = availableSeats.stream()
                    .collect(Collectors.groupingBy(SeatReservation::getShowtimeId));

            long totalCleared = 0;
            for (Map.Entry<String, List<SeatReservation>> entry : byShowtime.entrySet()) {
                String showtimeId = entry.getKey();
                List<SeatReservation> seats = entry.getValue();

                // For each AVAILABLE seat, remove any stale Redis lock
                for (SeatReservation seat : seats) {
                    seatLockService.releaseIfExists(showtimeId, seat.getSeatId());
                    totalCleared++;
                }
            }

            log.info("[Startup] Released stale Redis locks for {} AVAILABLE seats across {} showtimes.",
                    totalCleared, byShowtime.size());

        } catch (Exception e) {
            // Non-critical: log and continue — system will still work (TTL will expire locks)
            log.error("[Startup] Failed to sync Redis locks with DB: {}", e.getMessage(), e);
        }
    }
}
