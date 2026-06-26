package theater_mgnt.microserivce.booking_service.ticket.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketResponse;
import theater_mgnt.microserivce.booking_service.ticket.entity.Ticket;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    @Mapping(source = "id",              target = "id")
    @Mapping(source = "ticketCode",      target = "ticketCode")
    @Mapping(source = "qrContent",       target = "qrContent")
    @Mapping(source = "seatName",        target = "seatName")
    @Mapping(source = "price",           target = "price")
    @Mapping(source = "status",          target = "status")
    @Mapping(source = "usedAt",          target = "usedAt")
    @Mapping(source = "expiresAt",       target = "expiresAt")
    @Mapping(source = "bookingId",       target = "bookingId")
    TicketResponse toResponse(Ticket ticket);
}
