package theater_mgnt.microserivce.booking_service.ticket.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.booking_service.ticket.dto.request.TicketCheckInRequest;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketCheckInViewResponse;
import theater_mgnt.microserivce.booking_service.ticket.dto.response.TicketResponse;
import theater_mgnt.microserivce.booking_service.ticket.service.TicketService;

import java.util.List;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/by-booking/{bookingId}")
    public ApiResponse<List<TicketResponse>> getByBooking(@PathVariable String bookingId) {
        return ApiResponse.<List<TicketResponse>>builder()
                .result(ticketService.getTicketsByBooking(bookingId))
                .build();
    }

    @GetMapping("/by-customer/{customerId}")
    public ApiResponse<List<TicketResponse>> getByCustomer(@PathVariable String customerId) {
        return ApiResponse.<List<TicketResponse>>builder()
                .result(ticketService.getTicketsByCustomerId(customerId))
                .build();
    }

    @GetMapping("/{ticketCode}")
    public ApiResponse<TicketResponse> getByCode(@PathVariable String ticketCode) {
        return ApiResponse.<TicketResponse>builder()
                .result(ticketService.getTicketByCode(ticketCode))
                .build();
    }

    @GetMapping("/check-in/{ticketCode}")
    public ApiResponse<TicketCheckInViewResponse> getForCheckIn(@PathVariable String ticketCode) {
        return ApiResponse.<TicketCheckInViewResponse>builder()
                .result(ticketService.getTicketCheckInViewByCode(ticketCode))
                .build();
    }

    @PostMapping("/check-in/{ticketCode}")
    public ApiResponse<String> checkIn(@PathVariable String ticketCode) {
        ticketService.checkInTicket(TicketCheckInRequest.builder().ticketCode(ticketCode).build());
        return ApiResponse.<String>builder().result("Ticket checked in successfully").build();
    }
}
