package theater_mgnt.microserivce.booking_service.ticket.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketCheckInRequest {
    String ticketCode;
}
