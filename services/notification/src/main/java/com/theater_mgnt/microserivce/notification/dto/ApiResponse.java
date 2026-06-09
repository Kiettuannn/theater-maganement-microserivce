package com.theater_mgnt.microserivce.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.experimental.FieldDefaults;
import lombok.*;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    @Builder.Default
    private int code = 1000;

    private String message;
    private T result;

}
