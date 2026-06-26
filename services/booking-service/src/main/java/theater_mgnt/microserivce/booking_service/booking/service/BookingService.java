package theater_mgnt.microserivce.booking_service.booking.service;

import org.springframework.data.domain.Pageable;
import theater_mgnt.microserivce.booking_service.booking.dto.request.CreateBookingRequest;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingListResponse;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingSummaryResponse;
import theater_mgnt.microserivce.booking_service.booking.dto.response.CreateBookingResponse;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;

public interface BookingService {

    CreateBookingResponse createBooking(CreateBookingRequest request);

    BookingSummaryResponse getBookingSummary(String bookingId);

    void cancelBooking(String bookingId);

    void confirmBooking(String bookingId);

    BookingListResponse getBookings(BookingStatus status, String userId, String showtimeId, Pageable pageable);
}
