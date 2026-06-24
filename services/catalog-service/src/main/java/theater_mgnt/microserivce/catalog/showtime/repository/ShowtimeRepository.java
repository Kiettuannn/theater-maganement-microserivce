package theater_mgnt.microserivce.catalog.showtime.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import theater_mgnt.microserivce.catalog.showtime.entity.Showtime;
import theater_mgnt.microserivce.catalog.showtime.enums.ShowtimeStatus;

public interface ShowtimeRepository extends JpaRepository<Showtime, String> {

    List<Showtime> findByMovieId(String movieId);

    List<Showtime> findByRoomId(String roomId);

    // Used by MovieService: check if movie has SCHEDULED showtime (to block archive)
    boolean existsByMovieIdAndStatus(String movieId, ShowtimeStatus status);

    // Used by MovieService: check if movie has upcoming showtimes in time range (archive warning)
    boolean existsByMovieIdAndStartTimeBetween(String movieId, LocalDateTime startDate, LocalDateTime endDate);

    // Used by RoomService: check if room has SCHEDULED showtime in future (to block update/delete)
    boolean existsByRoomIdAndStatusAndStartTimeAfter(String roomId, ShowtimeStatus status, LocalDateTime startTime);

    // Used by ShowtimeService: check time overlap in room
    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN TRUE ELSE FALSE END
            FROM Showtime s
            WHERE s.room.id = :roomId
            AND (:excludeId IS NULL OR s.id <> :excludeId)
            AND s.startTime < :endTime
            AND s.endTime > :startTime
            """)
    boolean isTimeOverlap(String roomId, LocalDateTime startTime, LocalDateTime endTime, String excludeId);
}
