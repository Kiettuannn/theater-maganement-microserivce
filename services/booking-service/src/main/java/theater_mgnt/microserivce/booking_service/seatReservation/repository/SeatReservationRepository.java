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
     * Fixes H6: single query instead of two separate writes.
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
     * Kept for backward compatibility; prefer lockSeatsForBooking in new code.
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

    /** Cancel seats (LOCKED or CONFIRMED) → CANCELLED on booking cancellation */
    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = 'CANCELLED', s.releasedAt = :releasedAt " +
           "WHERE s.bookingId = :bookingId")
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
}

