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

    /** GET /tickets/by-booking/{bookingId} */
    @GetMapping("/by-booking/{bookingId}")
    public ApiResponse<List<TicketResponse>> getByBooking(@PathVariable String bookingId) {
        return ApiResponse.<List<TicketResponse>>builder()
                .result(ticketService.getTicketsByBooking(bookingId))
                .build();
    }

    /** GET /tickets/my-tickets/{userId} */
    @GetMapping("/my-tickets/{userId}")
    public ApiResponse<List<TicketResponse>> getByUser(@PathVariable String userId) {
        return ApiResponse.<List<TicketResponse>>builder()
                .result(ticketService.getTicketsByUserId(userId))
                .build();
    }

    /** GET /tickets/{ticketCode} */
    @GetMapping("/{ticketCode}")
    public ApiResponse<TicketResponse> getByCode(@PathVariable String ticketCode) {
        return ApiResponse.<TicketResponse>builder()
                .result(ticketService.getTicketByCode(ticketCode))
                .build();
    }

    /** GET /tickets/check-in/{ticketCode} — check-in view for staff UI */
    @GetMapping("/check-in/{ticketCode}")
    public ApiResponse<TicketCheckInViewResponse> getForCheckIn(@PathVariable String ticketCode) {
        return ApiResponse.<TicketCheckInViewResponse>builder()
                .result(ticketService.getTicketCheckInViewByCode(ticketCode))
                .build();
    }

    /** POST /tickets/check-in/{ticketCode} — perform check-in (ADMIN or STAFF) */
    @PostMapping("/check-in/{ticketCode}")
    public ApiResponse<String> checkIn(
            @PathVariable String ticketCode,
            @RequestBody(required = false) TicketCheckInRequest request) {
        TicketCheckInRequest req = request != null ? request
                : TicketCheckInRequest.builder().ticketCode(ticketCode).build();
        req.setTicketCode(ticketCode);
        ticketService.checkInTicket(req);
        return ApiResponse.<String>builder().result("Ticket checked in successfully").build();
    }

    /** POST /tickets/{ticketCode}/mark-for-transfer */
    @PostMapping("/{ticketCode}/mark-for-transfer")
    public ApiResponse<String> markForTransfer(@PathVariable String ticketCode) {
        ticketService.markForTransfer(ticketCode);
        return ApiResponse.<String>builder().result("Ticket marked for transfer").build();
    }

    /** POST /tickets/{ticketCode}/cancel-transfer */
    @PostMapping("/{ticketCode}/cancel-transfer")
    public ApiResponse<String> cancelTransfer(@PathVariable String ticketCode) {
        ticketService.cancelTransfer(ticketCode);
        return ApiResponse.<String>builder().result("Ticket transfer cancelled").build();
    }
}
