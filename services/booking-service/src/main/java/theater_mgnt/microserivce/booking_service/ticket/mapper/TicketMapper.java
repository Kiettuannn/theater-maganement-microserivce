package theater_mgnt.microserivce.booking_service.ticket.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketResponse;
import theater_mgnt.microserivce.booking_service.ticket.entity.Ticket;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    @Mapping(source = "booking.id", target = "bookingId")
    @Mapping(source = "booking.showtimeTitle", target = "movieTitle")
    @Mapping(source = "booking.showtimeStartTime", target = "startTime")
    TicketResponse toResponse(Ticket ticket);
}
