package theater_mgnt.microserivce.catalog.seatType.mapper;

import java.math.BigDecimal;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.seatType.dto.request.SeatTypeCreationRequest;
import theater_mgnt.microserivce.catalog.seatType.dto.request.SeatTypeUpdateRequest;
import theater_mgnt.microserivce.catalog.seatType.dto.response.SeatTypeResponse;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-02T09:29:05+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.7 (Oracle Corporation)"
)
@Component
public class SeatTypeMapperImpl implements SeatTypeMapper {

    @Override
    public SeatType toSeatType(SeatTypeCreationRequest request) {
        if ( request == null ) {
            return null;
        }

        SeatType.SeatTypeBuilder seatType = SeatType.builder();

        seatType.typeName( request.getTypeName() );
        if ( request.getBasePriceModifier() != null ) {
            seatType.basePriceModifier( BigDecimal.valueOf( request.getBasePriceModifier() ) );
        }

        return seatType.build();
    }

    @Override
    public SeatTypeResponse toSeatTypeResponse(SeatType seatType) {
        if ( seatType == null ) {
            return null;
        }

        SeatTypeResponse.SeatTypeResponseBuilder seatTypeResponse = SeatTypeResponse.builder();

        seatTypeResponse.id( seatType.getId() );
        seatTypeResponse.typeName( seatType.getTypeName() );
        seatTypeResponse.basePriceModifier( seatType.getBasePriceModifier() );

        return seatTypeResponse.build();
    }

    @Override
    public void updateSeatType(SeatType seatType, SeatTypeUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        seatType.setTypeName( request.getTypeName() );
        if ( request.getBasePriceModifier() != null ) {
            seatType.setBasePriceModifier( BigDecimal.valueOf( request.getBasePriceModifier() ) );
        }
        else {
            seatType.setBasePriceModifier( null );
        }
    }
}
