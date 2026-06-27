package theater_mgnt.microserivce.booking_service.bookingCombo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingPricingResponse;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.request.UpdateBookingCombosRequest;
import theater_mgnt.microserivce.booking_service.bookingCombo.service.BookingComboService;
import theater_mgnt.microserivce.booking_service.common.dto.response.ApiResponse;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingComboController {

    private final BookingComboService bookingComboService;

    @PutMapping("/{bookingId}/combos")
    public ApiResponse<BookingPricingResponse> updateCombos(
            @PathVariable String bookingId,
            @RequestBody @Valid UpdateBookingCombosRequest request) {
        return ApiResponse.<BookingPricingResponse>builder()
                .result(bookingComboService.updateCombos(bookingId, request))
                .build();
    }
}
