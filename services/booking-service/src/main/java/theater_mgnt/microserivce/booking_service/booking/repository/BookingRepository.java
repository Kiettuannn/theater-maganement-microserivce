package theater_mgnt.microserivce.booking_service.booking.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, String> {

    Optional<Booking> findByIdempotencyKey(String idempotencyKey);

    /** Find INITIATED bookings whose seat-hold has expired — for the expiry scheduler */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'INITIATED'
        AND b.expiresAt < :now
    """)
    List<Booking> findExpiredInitiatedBookings(@Param("now") Instant now);

    @Query("""
        SELECT b FROM Booking b
        WHERE (:status IS NULL OR b.status = :status)
        AND (:userId IS NULL OR b.userId = :userId)
        AND (:showtimeId IS NULL OR b.showtimeId = :showtimeId)
    """)
    Page<Booking> findBookings(
        @Param("status") BookingStatus status,
        @Param("userId") String userId,
        @Param("showtimeId") String showtimeId,
        Pageable pageable
    );

    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Booking> findByShowtimeId(String showtimeId);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.showtimeId = :showtimeId
        AND b.status IN :statuses
    """)
    List<Booking> findActiveBookingsByShowtimeId(
        @Param("showtimeId") String showtimeId,
        @Param("statuses") List<BookingStatus> statuses
    );
}
