package theater_mgnt.microserivce.booking_service.booking.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import theater_mgnt.microserivce.booking_service.booking.dto.response.CreateBookingResponse;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(source = "id",            target = "id")
    @Mapping(expression = "java(booking.getBookingCode())", target = "bookingCode")
    @Mapping(source = "userId",        target = "userId")
    @Mapping(source = "showtimeId",    target = "showtimeId")
    @Mapping(source = "status",        target = "status")
    @Mapping(source = "totalAmount",   target = "totalAmount")
    @Mapping(source = "currency",      target = "currency")
    @Mapping(source = "expiresAt",     target = "expiresAt")
    CreateBookingResponse toCreateBookingResponse(Booking booking);
}
