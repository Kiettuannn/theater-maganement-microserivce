package theater_mgnt.microserivce.catalog.movie.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.catalog.common.enums.MovieStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MovieResponse {

    String id;
    String title;
    String slug;
    String description;
    Integer durationMinutes;
    String director;
    String castMembers;
    String posterUrl;
    String trailerUrl;

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate releaseDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate endDate;

    MovieStatus status;

    // Nested objects
    AgeRatingInfo ageRating;
    Set<GenreInfo> genres;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class AgeRatingInfo {
        String id;
        String code;
        String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class GenreInfo {
        String id;
        String name;
    }
}

