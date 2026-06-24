package theater_mgnt.microserivce.booking_service.ticket.dto.response;


import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.response.ComboCheckInResponse;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketCheckInViewResponse {
    TicketResponse ticket;
    List<ComboCheckInResponse> comboCheckIn;
}
