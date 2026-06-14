package com.theatermgnt.theatermgnt.ticket.dto.request;

import jakarta.validation.constraints.NotNull;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComboUse {
    @NotNull
    String comboId;

    @NotNull
    int quantity;
}
