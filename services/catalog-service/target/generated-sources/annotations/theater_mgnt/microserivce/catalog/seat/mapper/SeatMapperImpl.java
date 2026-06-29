package theater_mgnt.microserivce.catalog.seat.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.seat.dto.request.SeatRequest;
import theater_mgnt.microserivce.catalog.seat.dto.response.SeatResponse;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-29T10:48:20+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.7 (Oracle Corporation)"
)
@Component
public class SeatMapperImpl implements SeatMapper {

    @Override
    public Seat toSeat(SeatRequest request) {
        if ( request == null ) {
            return null;
        }

        Seat.SeatBuilder seat = Seat.builder();

        seat.rowChair( request.getRowChair() );
        seat.seatNumber( request.getSeatNumber() );

        return seat.build();
    }

    @Override
    public SeatResponse toSeatResponse(Seat seat) {
        if ( seat == null ) {
            return null;
        }

        SeatResponse.SeatResponseBuilder seatResponse = SeatResponse.builder();

        seatResponse.seatTypeId( seatSeatTypeId( seat ) );
        seatResponse.id( seat.getId() );
        seatResponse.rowChair( seat.getRowChair() );
        seatResponse.seatNumber( seat.getSeatNumber() );

        seatResponse.seatName( seat.getRowChair() + seat.getSeatNumber() );

        return seatResponse.build();
    }

    @Override
    public void updateSeat(Seat seat, SeatRequest request) {
        if ( request == null ) {
            return;
        }

        seat.setRowChair( request.getRowChair() );
        seat.setSeatNumber( request.getSeatNumber() );
    }

    private String seatSeatTypeId(Seat seat) {
        if ( seat == null ) {
            return null;
        }
        SeatType seatType = seat.getSeatType();
        if ( seatType == null ) {
            return null;
        }
        String id = seatType.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
