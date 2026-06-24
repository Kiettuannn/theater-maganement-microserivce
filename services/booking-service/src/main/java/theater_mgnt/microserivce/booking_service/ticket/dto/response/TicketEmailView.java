package theater_mgnt.microserivce.booking_service.ticket.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Builder
@Getter
public class TicketEmailView {
    String seatCode;
    String seatType;
    String ticketCode;
    BigDecimal ticketPrice;
}
