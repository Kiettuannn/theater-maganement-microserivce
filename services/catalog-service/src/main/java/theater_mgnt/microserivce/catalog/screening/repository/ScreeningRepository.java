package theater_mgnt.microserivce.catalog.screening.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import theater_mgnt.microserivce.catalog.screening.entity.Screening;
import theater_mgnt.microserivce.catalog.screening.enums.ScreeningStatus;

public interface ScreeningRepository extends JpaRepository<Screening, String> {

    List<Screening> findByMovieId(String movieId);

    List<Screening> findByRoomId(String roomId);

    // Dùng bởi MovieService: kiểm tra phim có lịch chiếu SCHEDULED không (để block archive)
    boolean existsByMovieIdAndStatus(String movieId, ScreeningStatus status);

    // Dùng bởi MovieService: kiểm tra phim có lịch chiếu trong khoảng thời gian (archive warning)
    boolean existsByMovieIdAndStartTimeBetween(String movieId, LocalDateTime startDate, LocalDateTime endDate);

    // Dùng bởi RoomService: kiểm tra phòng có suất chiếu SCHEDULED trong tương lai không (để block update/delete)
    boolean existsByRoomIdAndStatusAndStartTimeAfter(String roomId, ScreeningStatus status, LocalDateTime startTime);

    // Dùng bởi ScreeningService: kiểm tra trùng giờ chiếu trong phòng
    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN TRUE ELSE FALSE END
            FROM Screening s
            WHERE s.room.id = :roomId
            AND (:excludeId IS NULL OR s.id <> :excludeId)
            AND s.startTime < :endTime
            AND s.endTime > :startTime
            """)
    boolean isTimeOverlap(String roomId, LocalDateTime startTime, LocalDateTime endTime, String excludeId);
}

