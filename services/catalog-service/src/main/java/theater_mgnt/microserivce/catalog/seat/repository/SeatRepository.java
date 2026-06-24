package theater_mgnt.microserivce.catalog.seat.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, String> {
    List<Seat> findByRoomId(String roomId);

    @Query("SELECT s FROM Seat s JOIN FETCH s.seatType WHERE s.room.id = :roomId AND s.deleted = false")
    List<Seat> findByRoomIdWithSeatType(@Param("roomId") String roomId);

    boolean existsByRowChairAndSeatNumberAndRoomId(String rowChair, Integer seatNumber, String roomId);

    long countByRoomId(String roomId);
}
