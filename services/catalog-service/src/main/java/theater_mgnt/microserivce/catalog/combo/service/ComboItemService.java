package theater_mgnt.microserivce.catalog.combo.service;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.catalog.combo.dto.request.ComboItemCreationRequest;
import theater_mgnt.microserivce.catalog.combo.dto.request.ComboItemUpdateRequest;
import theater_mgnt.microserivce.catalog.combo.dto.response.ComboItemResponse;
import theater_mgnt.microserivce.catalog.combo.entity.Combo;
import theater_mgnt.microserivce.catalog.combo.entity.ComboItem;
import theater_mgnt.microserivce.catalog.combo.mapper.ComboItemMapper;
import theater_mgnt.microserivce.catalog.combo.repository.ComboItemRepository;
import theater_mgnt.microserivce.catalog.combo.repository.ComboRepository;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ComboItemService {
    ComboItemRepository comboItemRepository;
    ComboRepository comboRepository;
    ComboItemMapper comboItemMapper;

    public ComboItemResponse createComboItem(ComboItemCreationRequest request) {
        Combo combo = comboRepository
                .findById(request.getComboId())
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_EXISTED));

        if (comboItemRepository.existsByNameAndComboId(request.getName(), request.getComboId()))
            throw new AppException(ErrorCode.COMBO_ITEM_EXISTED);

        ComboItem comboItem = comboItemMapper.toComboItem(request);
        comboItem.setCombo(combo);

        return comboItemMapper.toComboItemResponse(comboItemRepository.save(comboItem));
    }

    public List<ComboItemResponse> getComboItemsByCombo(String comboId) {
        return comboItemRepository.findByComboId(comboId).stream()
                .map(comboItemMapper::toComboItemResponse)
                .toList();
    }

    public List<ComboItemResponse> getComboItems() {
        return comboItemRepository.findAll().stream()
                .map(comboItemMapper::toComboItemResponse)
                .toList();
    }

    public ComboItemResponse getComboItem(String comboItemId) {
        ComboItem comboItem = comboItemRepository
                .findById(comboItemId)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_ITEM_NOT_EXISTED));
        return comboItemMapper.toComboItemResponse(comboItem);
    }

    public ComboItemResponse updateComboItem(String comboItemId, ComboItemUpdateRequest request) {
        ComboItem comboItem = comboItemRepository
                .findById(comboItemId)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_ITEM_NOT_EXISTED));

        comboItemMapper.updateComboItem(comboItem, request);
        return comboItemMapper.toComboItemResponse(comboItemRepository.save(comboItem));
    }

    public void deleteComboItem(String comboItemId) {
        if (!comboItemRepository.existsById(comboItemId)) throw new AppException(ErrorCode.COMBO_ITEM_NOT_EXISTED);
        comboItemRepository.deleteById(comboItemId);
    }
}
