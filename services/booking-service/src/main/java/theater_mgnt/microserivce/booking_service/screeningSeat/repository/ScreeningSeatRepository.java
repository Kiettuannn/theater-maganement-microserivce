package com.theatermgnt.theatermgnt.screeningSeat.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import com.theatermgnt.theatermgnt.screeningSeat.entity.ScreeningSeat;

public interface ScreeningSeatRepository extends JpaRepository<ScreeningSeat, String> {
    List<ScreeningSeat> findByScreeningId(String screeningId);

    List<ScreeningSeat> findBySeatId(String seatId);
    //    List<ScreeningSeat> findByBookingId(String bookingId);
    boolean existsByScreeningIdAndSeatId(String screeningId, String seatId);

    void deleteByScreeningId(String screeningId);

    @Transactional
    @Modifying
    @Query("UPDATE ScreeningSeat s SET s.deleted = true WHERE s.screening.id = :screeningId")
    void softDeleteByScreeningId(String screeningId);

    @Query("SELECT COUNT(s) > 0 FROM ScreeningSeat s WHERE s.screening.id = :screeningId AND s.status = 'SOLD'")
    boolean existsSoldSeat(String screeningId);

    @Query("SELECT COUNT(s) FROM ScreeningSeat s WHERE s.screening.id = :screeningId AND s.status = 'SOLD'")
    Integer countBookedSeats(String screeningId);

    @Modifying
    @Query(
            """
		UPDATE ScreeningSeat ss
		SET ss.status = 'LOCKED'
		WHERE ss.screening.id = :screeningId
		AND ss.status = 'AVAILABLE'
	""")
    void lockAvailableSeatsByScreening(String screeningId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            """
		UPDATE ScreeningSeat s
		SET s.status = 'LOCKED',
			s.lockUntil = :lockUntil
		WHERE s.id IN :ids
		AND s.status = 'AVAILABLE'
	""")
    int lockSeats(List<String> ids, Instant lockUntil);

    List<ScreeningSeat> findByBooking(String bookingId);

    long countByBooking(String bookingId);

    @Modifying
    @Query(
            """
		UPDATE ScreeningSeat s
		SET s.status = 'AVAILABLE',
			s.lockUntil = null,
			s.booking = null
		WHERE s.booking = :bookingId
	""")
    void releaseSeatsByBooking(String bookingId);

    @Modifying
    @Query(
            """
		UPDATE ScreeningSeat s
		SET s.status = 'SOLD',
			s.lockUntil = null
		WHERE s.booking = :bookingId
	""")
    void markSeatsAsSoldByBooking(String bookingId);
}
