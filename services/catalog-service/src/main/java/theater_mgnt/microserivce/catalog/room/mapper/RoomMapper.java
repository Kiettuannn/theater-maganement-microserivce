package theater_mgnt.microserivce.catalog.room.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import theater_mgnt.microserivce.catalog.room.dto.request.RoomCreationRequest;
import theater_mgnt.microserivce.catalog.room.dto.request.RoomUpdateRequest;
import theater_mgnt.microserivce.catalog.room.dto.response.RoomResponse;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.seat.mapper.SeatMapper;

@Mapper(
        componentModel = "spring",
        uses = {SeatMapper.class})
public interface RoomMapper {
    @Mapping(target = "seats", ignore = true)
    Room toRoom(RoomCreationRequest request);

    @Mapping(target = "seats", ignore = true)
    RoomResponse toRoomResponse(Room room);

    RoomResponse toRoomResponseWithSeats(Room room);

    @Mapping(target = "seats", ignore = true)
    @Mapping(target = "id", ignore = true)
    void updateRoom(@MappingTarget Room room, RoomUpdateRequest request);
}

