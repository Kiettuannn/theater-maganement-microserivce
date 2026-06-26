package theater_mgnt.microserivce.catalog.combo.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import theater_mgnt.microserivce.catalog.combo.dto.request.ComboCreationRequest;
import theater_mgnt.microserivce.catalog.combo.dto.request.ComboUpdateRequest;
import theater_mgnt.microserivce.catalog.combo.dto.response.ComboResponse;
import theater_mgnt.microserivce.catalog.combo.entity.Combo;

@Mapper(componentModel = "spring")
public interface ComboMapper {
    Combo toCombo(ComboCreationRequest request);

    ComboResponse toComboResponse(Combo combo);

    void updateCombo(@MappingTarget Combo combo, ComboUpdateRequest request);
}
