package theater_mgnt.microserivce.catalog.seatType.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import theater_mgnt.microserivce.catalog.seatType.dto.request.SeatTypeCreationRequest;
import theater_mgnt.microserivce.catalog.seatType.dto.request.SeatTypeUpdateRequest;
import theater_mgnt.microserivce.catalog.seatType.dto.response.SeatTypeResponse;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;

@Mapper(componentModel = "spring")
public interface SeatTypeMapper {
    SeatType toSeatType(SeatTypeCreationRequest request);

    SeatTypeResponse toSeatTypeResponse(SeatType seatType);

    void updateSeatType(@MappingTarget SeatType seatType, SeatTypeUpdateRequest request);
}
