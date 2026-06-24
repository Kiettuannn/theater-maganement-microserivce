package theater_mgnt.microserivce.catalog.movie.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateGenreRequest {

    @NotBlank(message = "GENRE_ID_REQUIRED")
    @Size(max = 50, message = "INVALID_GENRE_ID")
    String id;

    @NotBlank(message = "GENRE_NAME_REQUIRED")
    @Size(max = 100, message = "INVALID_GENRE_NAME")
    String name;
}

