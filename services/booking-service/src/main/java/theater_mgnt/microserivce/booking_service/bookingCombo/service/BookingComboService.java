package theater_mgnt.microserivce.booking_service.bookingCombo.service;

import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingPricingResponse;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.request.UpdateBookingCombosRequest;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.response.ComboCheckInResponse;

import java.util.List;

public interface BookingComboService {
    BookingPricingResponse updateCombos(String bookingId, UpdateBookingCombosRequest request);

    List<ComboCheckInResponse> getCombos(String bookingId);
}
