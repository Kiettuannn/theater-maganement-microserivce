package theater_mgnt.microserivce.booking_service.combo.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import theater_mgnt.microserivce.booking_service.combo.dto.request.ComboItemCreationRequest;
import theater_mgnt.microserivce.booking_service.combo.dto.request.ComboItemUpdateRequest;
import theater_mgnt.microserivce.booking_service.combo.dto.response.ComboItemResponse;
import theater_mgnt.microserivce.booking_service.combo.entity.ComboItem;

@Mapper(componentModel = "spring")
public interface ComboItemMapper {
    ComboItem toComboItem(ComboItemCreationRequest request);

    @Mapping(target = "comboName", source = "combo.name")
    ComboItemResponse toComboItemResponse(ComboItem comboItem);

    void updateComboItem(@MappingTarget ComboItem comboItem, ComboItemUpdateRequest request);
}
