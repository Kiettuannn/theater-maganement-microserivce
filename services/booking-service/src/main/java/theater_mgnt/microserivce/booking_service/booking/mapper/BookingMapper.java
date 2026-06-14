package theater_mgnt.microserivce.booking_service.booking.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import theater_mgnt.microserivce.booking_service.booking.dto.response.CreateBookingResponse;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(source = "id", target = "id")
    @Mapping(source = "customerId", target = "customerId")
    @Mapping(source = "showtimeId", target = "showtimeId")
    @Mapping(source = "showtimeTitle", target = "showtimeTitle")
    @Mapping(source = "showtimeStartTime", target = "showtimeStartTime")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "totalAmount", target = "totalAmount")
    @Mapping(source = "expiredAt", target = "expiredAt")
    CreateBookingResponse toCreateBookingResponse(Booking booking);
}
