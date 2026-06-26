package theater_mgnt.microserivce.catalog.seat.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import theater_mgnt.microserivce.catalog.seat.dto.request.SeatRequest;
import theater_mgnt.microserivce.catalog.seat.dto.response.SeatResponse;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;

@Mapper(componentModel = "spring")
public interface SeatMapper {

    Seat toSeat(SeatRequest request);

    @Mapping(source = "seatType.id", target = "seatTypeId")
    @Mapping(target = "seatName", expression = "java(seat.getRowChair() + seat.getSeatNumber())")
    SeatResponse toSeatResponse(Seat seat);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "seatType", ignore = true)
    void updateSeat(@MappingTarget Seat seat, SeatRequest request);
}
