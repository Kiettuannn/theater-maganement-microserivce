package theater_mgnt.microserivce.catalog.priceConfig.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import theater_mgnt.microserivce.catalog.priceConfig.dto.request.PriceConfigCreationRequest;
import theater_mgnt.microserivce.catalog.priceConfig.dto.request.PriceConfigUpdateRequest;
import theater_mgnt.microserivce.catalog.priceConfig.dto.response.PriceConfigResponse;
import theater_mgnt.microserivce.catalog.priceConfig.entity.PriceConfig;

@Mapper(componentModel = "spring")
public interface PriceConfigMapper {
    PriceConfig toPriceConfig(PriceConfigCreationRequest request);

    @Mapping(target = "seatTypeName", source = "seatType.typeName")
    PriceConfigResponse toPriceConfigResponse(PriceConfig priceConfig);

    void updatePriceConfig(@MappingTarget PriceConfig priceConfig, PriceConfigUpdateRequest request);
}
