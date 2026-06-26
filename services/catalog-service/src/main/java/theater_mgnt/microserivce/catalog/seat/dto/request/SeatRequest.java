package theater_mgnt.microserivce.catalog.seat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatRequest {
    String id;

    @NotBlank(message = "Row chair is required")
    String rowChair;

    @NotNull(message = "Seat number is required")
    Integer seatNumber;

    @NotBlank(message = "Seat type ID is required")
    String seatTypeId;
}
