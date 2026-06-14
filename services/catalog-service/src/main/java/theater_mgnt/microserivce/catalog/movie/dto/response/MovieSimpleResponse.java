package theater_mgnt.microserivce.catalog.movie.dto.response;

import java.time.LocalDate;
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
public class MovieSimpleResponse {

    String id;
    String title;
    String slug;
    String posterUrl;
    String trailerUrl;

    Integer durationMinutes;

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate releaseDate;

    MovieStatus status;
    String ageRatingCode;
    String director;
    Set<GenreInfo> genres;
    Boolean needsArchiveWarning;

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

