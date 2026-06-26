package theater_mgnt.microserivce.catalog.movie.dto.request;

import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;


import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.catalog.common.enums.MovieStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateMovieRequest {

    @Size(max = 255, message = "INVALID_MOVIE_TITLE")
    String title;

    @Size(max = 5000, message = "INVALID_MOVIE_DESCRIPTION")
    String description;

    @Min(value = 1, message = "INVALID_MOVIE_DURATION")
    @Max(value = 500, message = "INVALID_MOVIE_DURATION")
    Integer durationMinutes;

    @Size(max = 255, message = "INVALID_MOVIE_DIRECTOR")
    String director;

    @Size(max = 2000, message = "INVALID_MOVIE_CAST")
    String castMembers;

    @Pattern(regexp = "^https?://.*", message = "INVALID_POSTER_URL")
    String posterUrl;

    @Pattern(regexp = "^https?://.*", message = "INVALID_TRAILER_URL")
    String trailerUrl;

    LocalDate releaseDate;

    LocalDate endDate;

    String ageRatingId;

    MovieStatus status;

    @Size(min = 1, max = 10, message = "INVALID_MOVIE_GENRES")
    Set<String> genreIds;
}

