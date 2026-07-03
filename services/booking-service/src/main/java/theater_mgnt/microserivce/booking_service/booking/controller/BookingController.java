package theater_mgnt.microserivce.booking_service.booking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.booking.dto.request.ConfirmBookingRequest;
import theater_mgnt.microserivce.booking_service.booking.dto.request.CreateBookingRequest;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingListResponse;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingSummaryResponse;
import theater_mgnt.microserivce.booking_service.booking.dto.response.CreateBookingResponse;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.service.BookingService;
import theater_mgnt.microserivce.booking_service.common.dto.response.ApiResponse;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ApiResponse<CreateBookingResponse> createBooking(@RequestBody @Valid CreateBookingRequest request) {
        return ApiResponse.<CreateBookingResponse>builder()
                .result(bookingService.createBooking(request))
                .build();
    }

    @GetMapping("/{bookingId}/summary")
    public ApiResponse<BookingSummaryResponse> getSummary(@PathVariable String bookingId) {
        return ApiResponse.<BookingSummaryResponse>builder()
                .result(bookingService.getBookingSummary(bookingId))
                .build();
    }

    @PostMapping("/{bookingId}/cancel")
    public ApiResponse<String> cancelBooking(@PathVariable String bookingId) {
        bookingService.cancelBooking(bookingId);
        return ApiResponse.<String>builder().result("Booking cancelled successfully").build();
    }

    @PostMapping("/{bookingId}/confirm")
    public ApiResponse<String> confirmBooking(
            @PathVariable String bookingId,
            @RequestBody(required = false) ConfirmBookingRequest request) {
        bookingService.confirmBooking(bookingId, request);
        return ApiResponse.<String>builder().result("Booking confirmed successfully").build();
    }

    @GetMapping
    public ApiResponse<BookingListResponse> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String showtimeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        return ApiResponse.<BookingListResponse>builder()
                .result(bookingService.getBookings(status, userId, showtimeId, pageable))
                .build();
    }
}
