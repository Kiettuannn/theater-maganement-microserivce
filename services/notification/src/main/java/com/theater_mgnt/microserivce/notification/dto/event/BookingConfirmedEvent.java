package com.theater_mgnt.microserivce.notification.dto.event;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingConfirmedEvent {
    String bookingId;
    String userId;
    String showtimeId;
    String confirmedAt;
    BigDecimal ticketRevenue;
    BigDecimal totalAmount;
    Integer totalTicketsSold;
    String showtimeDate;
}
