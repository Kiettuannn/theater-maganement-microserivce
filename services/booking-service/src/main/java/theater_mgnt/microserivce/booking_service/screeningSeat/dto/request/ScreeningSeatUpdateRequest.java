package com.theatermgnt.theatermgnt.screeningSeat.dto.request;

import jakarta.validation.constraints.NotNull;

import com.theatermgnt.theatermgnt.screeningSeat.enums.ScreeningSeatStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScreeningSeatUpdateRequest {

    @NotNull
    String bookingId;

    @NotNull
    ScreeningSeatStatus status;
}
