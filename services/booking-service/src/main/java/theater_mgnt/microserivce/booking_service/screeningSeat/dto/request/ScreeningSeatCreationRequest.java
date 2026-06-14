package com.theatermgnt.theatermgnt.screeningSeat.dto.request;

import jakarta.validation.constraints.NotNull;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScreeningSeatCreationRequest {
    @NotNull
    String screeningId;

    @NotNull
    String seatId;
}
