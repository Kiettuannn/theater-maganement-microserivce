package com.theatermgnt.theatermgnt.screeningSeat.dto.response;

import java.math.BigDecimal;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScreeningSeatResponse {
    String id;
    String screeningId;
    String seatId;
    String seatNumber;
    String seatType;
    BigDecimal price;
    String bookingId;
    String status;

    Boolean isForTransfer;
    String transferTicketId;
    String sellerName;
    String sellerEmail;
    String sellerPhone;
}
