package theater_mgnt.microserivce.catalog.room.mapper;

import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.room.dto.request.RoomCreationRequest;
import theater_mgnt.microserivce.catalog.room.dto.request.RoomUpdateRequest;
import theater_mgnt.microserivce.catalog.room.dto.response.RoomResponse;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.seat.dto.response.SeatResponse;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;
import theater_mgnt.microserivce.catalog.seat.mapper.SeatMapper;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-02T20:25:13+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class RoomMapperImpl implements RoomMapper {

    @Autowired
    private SeatMapper seatMapper;

    @Override
    public Room toRoom(RoomCreationRequest request) {
        if ( request == null ) {
            return null;
        }

        Room.RoomBuilder room = Room.builder();

        room.name( request.getName() );
        room.roomType( request.getRoomType() );
        room.status( request.getStatus() );

        return room.build();
    }

    @Override
    public RoomResponse toRoomResponse(Room room) {
        if ( room == null ) {
            return null;
        }

        RoomResponse.RoomResponseBuilder roomResponse = RoomResponse.builder();

        roomResponse.id( room.getId() );
        roomResponse.name( room.getName() );
        if ( room.getRoomType() != null ) {
            roomResponse.roomType( room.getRoomType().name() );
        }
        if ( room.getStatus() != null ) {
            roomResponse.status( room.getStatus().name() );
        }
        roomResponse.totalSeats( room.getTotalSeats() );

        return roomResponse.build();
    }

    @Override
    public RoomResponse toRoomResponseWithSeats(Room room) {
        if ( room == null ) {
            return null;
        }

        RoomResponse.RoomResponseBuilder roomResponse = RoomResponse.builder();

        roomResponse.id( room.getId() );
        roomResponse.name( room.getName() );
        if ( room.getRoomType() != null ) {
            roomResponse.roomType( room.getRoomType().name() );
        }
        if ( room.getStatus() != null ) {
            roomResponse.status( room.getStatus().name() );
        }
        roomResponse.totalSeats( room.getTotalSeats() );
        roomResponse.seats( seatListToSeatResponseList( room.getSeats() ) );

        return roomResponse.build();
    }

    @Override
    public void updateRoom(Room room, RoomUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        room.setName( request.getName() );
        room.setRoomType( request.getRoomType() );
        room.setStatus( request.getStatus() );
    }

    protected List<SeatResponse> seatListToSeatResponseList(List<Seat> list) {
        if ( list == null ) {
            return null;
        }

        List<SeatResponse> list1 = new ArrayList<SeatResponse>( list.size() );
        for ( Seat seat : list ) {
            list1.add( seatMapper.toSeatResponse( seat ) );
        }

        return list1;
    }
}
