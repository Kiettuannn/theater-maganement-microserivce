package theater_mgnt.microserivce.booking_service.ticket.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketResponse {
    String id;
    String ticketCode;
    String qrContent;
    String seatName;
    BigDecimal price;
    TicketStatus status;
    Instant usedAt;
    Instant expiresAt;
    LocalDateTime createdAt;
    String bookingId;
}
