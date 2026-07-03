package theater_mgnt.microserivce.booking_service.seatReservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;

import java.time.Instant;
import java.util.List;

public interface SeatReservationRepository extends JpaRepository<SeatReservation, String> {

    List<SeatReservation> findByShowtimeId(String showtimeId);

    List<SeatReservation> findByShowtimeIdAndSeatIdIn(String showtimeId, List<String> seatIds);

    List<SeatReservation> findByBookingId(String bookingId);

    long countByBookingId(String bookingId);

    /** Idempotency check used by ShowtimeCreated consumer */
    boolean existsByShowtimeIdAndSeatId(String showtimeId, String seatId);

    /**
     * CAS-style atomic UPDATE: AVAILABLE → LOCKED, simultaneously linking booking_id.
     * Returns number of rows updated — caller checks == requested count.
     */
    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = 'LOCKED', s.lockedAt = :lockedAt, s.bookingId = :bookingId " +
           "WHERE s.id IN :ids AND s.status = 'AVAILABLE'")
    int lockSeatsForBooking(@Param("ids") List<String> ids,
                            @Param("lockedAt") Instant lockedAt,
                            @Param("bookingId") String bookingId);

    /**
     * Legacy: CAS-style atomic UPDATE AVAILABLE → LOCKED (without setting booking_id).
     */
    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = 'LOCKED', s.lockedAt = :lockedAt " +
           "WHERE s.id IN :ids AND s.status = 'AVAILABLE'")
    int lockSeats(@Param("ids") List<String> ids, @Param("lockedAt") Instant lockedAt);

    /** Release seats back to AVAILABLE on booking expiry/failure (LOCKED only) */
    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = 'AVAILABLE', s.releasedAt = :releasedAt, s.bookingId = null " +
           "WHERE s.bookingId = :bookingId AND s.status = 'LOCKED'")
    void releaseLockedByBookingId(@Param("bookingId") String bookingId,
                                   @Param("releasedAt") Instant releasedAt);

    /** Cancel booking: reset LOCKED seats back to AVAILABLE so they can be re-booked */
    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = 'AVAILABLE', s.releasedAt = :releasedAt, s.bookingId = null " +
           "WHERE s.bookingId = :bookingId AND s.status IN ('LOCKED', 'INITIATED')")
    void cancelByBookingId(@Param("bookingId") String bookingId,
                            @Param("releasedAt") Instant releasedAt);

    /** Confirm seats LOCKED → CONFIRMED after payment confirmed */
    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = 'CONFIRMED', s.confirmedAt = :confirmedAt " +
           "WHERE s.bookingId = :bookingId AND s.status = 'LOCKED'")
    void confirmByBookingId(@Param("bookingId") String bookingId,
                             @Param("confirmedAt") Instant confirmedAt);

    /** Cancel all reservations for a showtime (ShowtimeCancelled event) */
    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = 'CANCELLED' WHERE s.showtimeId = :showtimeId")
    void cancelAllByShowtimeId(@Param("showtimeId") String showtimeId);

    List<SeatReservation> findByShowtimeIdAndStatus(String showtimeId, SeatReservationStatus status);

    /** Used by RedisStartupSyncService to clear stale locks on startup */
    List<SeatReservation> findByStatus(SeatReservationStatus status);
}
