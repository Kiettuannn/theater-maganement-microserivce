package theater_mgnt.microserivce.catalog.movie.dto.request;

import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateAgeRatingRequest {

    @Size(max = 50, message = "INVALID_AGERATING_ID")
    String id;

    @Size(min = 1, max = 10, message = "INVALID_AGERATING_CODE")
    String code;

    @Size(max = 500, message = "INVALID_AGERATING_DESCRIPTION")
    String description;
}

