package theater_mgnt.microserivce.booking_service.booking.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = :pending
        AND b.expiredAt < :now
    """)
    List<Booking> findExpiredPendingBookings(@Param("now") LocalDateTime now,
                                             @Param("pending") BookingStatus pending);

    @Query("""
        SELECT b FROM Booking b
        WHERE (:status IS NULL OR b.status = :status)
        AND (:customerId IS NULL OR b.customerId = :customerId)
        AND (:showtimeId IS NULL OR b.showtimeId = :showtimeId)
    """)
    Page<Booking> findBookings(
        @Param("status") BookingStatus status,
        @Param("customerId") String customerId,
        @Param("showtimeId") String showtimeId,
        Pageable pageable
    );

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(String customerId);

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
