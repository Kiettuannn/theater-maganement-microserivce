package theater_mgnt.microserivce.booking_service.ticket.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketCheckInResponse {
    String ticketCode;
    TicketStatus status;
    LocalDateTime usedAt;
    String message;
}
