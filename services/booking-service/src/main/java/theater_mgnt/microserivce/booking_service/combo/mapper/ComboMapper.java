package theater_mgnt.microserivce.booking_service.combo.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import theater_mgnt.microserivce.booking_service.combo.dto.request.ComboCreationRequest;
import theater_mgnt.microserivce.booking_service.combo.dto.request.ComboUpdateRequest;
import theater_mgnt.microserivce.booking_service.combo.dto.response.ComboResponse;
import theater_mgnt.microserivce.booking_service.combo.entity.Combo;

@Mapper(componentModel = "spring")
public interface ComboMapper {
    Combo toCombo(ComboCreationRequest request);

    ComboResponse toComboResponse(Combo combo);

    void updateCombo(@MappingTarget Combo combo, ComboUpdateRequest request);
}
