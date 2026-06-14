package com.theatermgnt.theatermgnt.screeningSeat.mapper;

import java.math.BigDecimal;
import java.util.Map;

import org.mapstruct.*;

import com.theatermgnt.theatermgnt.screeningSeat.dto.request.ScreeningSeatCreationRequest;
import com.theatermgnt.theatermgnt.screeningSeat.dto.request.ScreeningSeatUpdateRequest;
import com.theatermgnt.theatermgnt.screeningSeat.dto.response.ScreeningSeatResponse;
import com.theatermgnt.theatermgnt.screeningSeat.entity.ScreeningSeat;
import com.theatermgnt.theatermgnt.seat.entity.Seat;

@Mapper(componentModel = "spring")
public interface ScreeningSeatMapper {

    @Mapping(target = "screening", ignore = true)
    @Mapping(target = "seat", ignore = true)
    ScreeningSeat toScreeningSeat(ScreeningSeatCreationRequest request);

    @Mapping(target = "screeningId", source = "screening.id")
    @Mapping(target = "seatId", source = "seat.id")
    @Mapping(target = "seatNumber", expression = "java(combineSeatInfo(screeningSeat.getSeat()))")
    @Mapping(
            target = "seatType",
            expression =
                    "java(screeningSeat.getSeat() != null ? screeningSeat.getSeat().getSeatType().getTypeName() : null)")
    @Mapping(target = "price", source = "screeningSeat", qualifiedByName = "mapPrice")
    ScreeningSeatResponse toScreeningSeatResponse(
            ScreeningSeat screeningSeat, @Context Map<String, BigDecimal> priceMap);

    default String combineSeatInfo(Seat seat) {
        if (seat == null) return null;
        return seat.getRowChair() + seat.getSeatNumber();
    }

    @Named("mapPrice")
    default BigDecimal mapPrice(ScreeningSeat screeningSeat, @Context Map<String, BigDecimal> priceMap) {
        if (screeningSeat.getSeat() == null || screeningSeat.getSeat().getSeatType() == null) {
            return null;
        }
        String seatTypeId = screeningSeat.getSeat().getSeatType().getId();
        return priceMap.getOrDefault(
                seatTypeId, screeningSeat.getSeat().getSeatType().getBasePriceModifier());
    }

    void updateScreeningSeat(@MappingTarget ScreeningSeat screeningSeat, ScreeningSeatUpdateRequest request);
}
