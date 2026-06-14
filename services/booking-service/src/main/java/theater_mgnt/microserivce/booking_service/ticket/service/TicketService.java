package theater_mgnt.microserivce.booking_service.ticket.service;

import theater_mgnt.microserivce.booking_service.ticket.dto.request.TicketCheckInRequest;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketCheckInResponse;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketCheckInViewResponse;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketResponse;

import java.util.List;

public interface TicketService {

    List<TicketResponse> getTicketsByBooking(String bookingId);

    List<TicketResponse> getTicketsByCustomerId(String customerId);

    TicketResponse getTicketByCode(String ticketCode);

    TicketCheckInViewResponse getTicketCheckInViewByCode(String ticketCode);

    void createTickets(String bookingId);

    void checkInTicket(TicketCheckInRequest request);

    void expireTickets();
}
