package theater_mgnt.microserivce.booking_service.booking.mapper;

import org.mapstruct.Mapper;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingPricingResponse;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;

@Mapper(componentModel = "spring")
public interface BookingPricingMapper {
    default BookingPricingResponse toPricingResponse(Booking booking) {
        BookingPricingResponse res = new BookingPricingResponse();
        res.setBookingId(booking.getId());
        res.setTotalAmount(booking.getTotalAmount());
        return res;
    }
}
