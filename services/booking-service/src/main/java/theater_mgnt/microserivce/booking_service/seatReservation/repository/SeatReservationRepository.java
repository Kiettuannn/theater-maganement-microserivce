package theater_mgnt.microserivce.booking_service.seatReservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;

import java.util.List;

public interface SeatReservationRepository extends JpaRepository<SeatReservation, String> {

    List<SeatReservation> findByShowtimeId(String showtimeId);

    List<SeatReservation> findByShowtimeIdAndSeatIdIn(String showtimeId, List<String> seatIds);

    List<SeatReservation> findByBookingId(String bookingId);

    long countByBookingId(String bookingId);

    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = :available, s.bookingId = null, s.lockUntil = null WHERE s.bookingId = :bookingId AND s.status = :locked")
    void releaseByBookingId(
        @Param("bookingId") String bookingId,
        @Param("available") SeatReservationStatus available,
        @Param("locked") SeatReservationStatus locked
    );

    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = :available, s.bookingId = null, s.lockUntil = null WHERE s.bookingId = :bookingId")
    void releaseAllByBookingId(
        @Param("bookingId") String bookingId,
        @Param("available") SeatReservationStatus available
    );

    @Modifying
    @Query("UPDATE SeatReservation s SET s.status = :booked, s.lockUntil = null WHERE s.bookingId = :bookingId")
    void confirmByBookingId(
        @Param("bookingId") String bookingId,
        @Param("booked") SeatReservationStatus booked
    );

    void deleteByShowtimeId(String showtimeId);
}
