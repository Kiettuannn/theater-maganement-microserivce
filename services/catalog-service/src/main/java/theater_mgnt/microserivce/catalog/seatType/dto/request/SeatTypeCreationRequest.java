package theater_mgnt.microserivce.catalog.seatType.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatTypeCreationRequest {
    @NotBlank
    String typeName;

    @NotNull
    Double basePriceModifier;
}
