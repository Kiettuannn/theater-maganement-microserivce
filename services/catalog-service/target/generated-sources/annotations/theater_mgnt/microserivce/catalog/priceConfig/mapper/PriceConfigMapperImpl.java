package theater_mgnt.microserivce.catalog.priceConfig.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.common.enums.DayType;
import theater_mgnt.microserivce.catalog.common.enums.TimeSlot;
import theater_mgnt.microserivce.catalog.priceConfig.dto.request.PriceConfigCreationRequest;
import theater_mgnt.microserivce.catalog.priceConfig.dto.request.PriceConfigUpdateRequest;
import theater_mgnt.microserivce.catalog.priceConfig.dto.response.PriceConfigResponse;
import theater_mgnt.microserivce.catalog.priceConfig.entity.PriceConfig;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-12T16:06:56+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class PriceConfigMapperImpl implements PriceConfigMapper {

    @Override
    public PriceConfig toPriceConfig(PriceConfigCreationRequest request) {
        if ( request == null ) {
            return null;
        }

        PriceConfig.PriceConfigBuilder priceConfig = PriceConfig.builder();

        if ( request.getDayType() != null ) {
            priceConfig.dayType( Enum.valueOf( DayType.class, request.getDayType() ) );
        }
        if ( request.getTimeSlot() != null ) {
            priceConfig.timeSlot( Enum.valueOf( TimeSlot.class, request.getTimeSlot() ) );
        }
        priceConfig.price( request.getPrice() );

        return priceConfig.build();
    }

    @Override
    public PriceConfigResponse toPriceConfigResponse(PriceConfig priceConfig) {
        if ( priceConfig == null ) {
            return null;
        }

        PriceConfigResponse.PriceConfigResponseBuilder priceConfigResponse = PriceConfigResponse.builder();

        priceConfigResponse.seatTypeName( priceConfigSeatTypeTypeName( priceConfig ) );
        priceConfigResponse.id( priceConfig.getId() );
        priceConfigResponse.dayType( priceConfig.getDayType() );
        priceConfigResponse.timeSlot( priceConfig.getTimeSlot() );
        priceConfigResponse.price( priceConfig.getPrice() );

        return priceConfigResponse.build();
    }

    @Override
    public void updatePriceConfig(PriceConfig priceConfig, PriceConfigUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        if ( request.getDayType() != null ) {
            priceConfig.setDayType( Enum.valueOf( DayType.class, request.getDayType() ) );
        }
        else {
            priceConfig.setDayType( null );
        }
        if ( request.getTimeSlot() != null ) {
            priceConfig.setTimeSlot( Enum.valueOf( TimeSlot.class, request.getTimeSlot() ) );
        }
        else {
            priceConfig.setTimeSlot( null );
        }
        priceConfig.setPrice( request.getPrice() );
    }

    private String priceConfigSeatTypeTypeName(PriceConfig priceConfig) {
        if ( priceConfig == null ) {
            return null;
        }
        SeatType seatType = priceConfig.getSeatType();
        if ( seatType == null ) {
            return null;
        }
        String typeName = seatType.getTypeName();
        if ( typeName == null ) {
            return null;
        }
        return typeName;
    }
}
