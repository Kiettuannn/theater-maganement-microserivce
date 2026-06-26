package theater_mgnt.microserivce.catalog.showtime.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import theater_mgnt.microserivce.catalog.common.entity.BaseEntity;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.showtime.enums.ShowtimeStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "showtimes")
@SQLDelete(sql = "UPDATE showtimes SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Showtime extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roomId", nullable = false)
    Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movieId", nullable = false)
    Movie movie;

    LocalDateTime startTime;
    LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    ShowtimeStatus status;
}
