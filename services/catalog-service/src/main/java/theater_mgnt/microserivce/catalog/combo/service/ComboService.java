package theater_mgnt.microserivce.catalog.combo.service;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

import theater_mgnt.microserivce.catalog.combo.dto.request.ComboCreationRequest;
import theater_mgnt.microserivce.catalog.combo.dto.request.ComboUpdateRequest;
import theater_mgnt.microserivce.catalog.combo.dto.response.ComboResponse;
import theater_mgnt.microserivce.catalog.combo.entity.Combo;
import theater_mgnt.microserivce.catalog.combo.mapper.ComboMapper;
import theater_mgnt.microserivce.catalog.combo.repository.ComboRepository;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ComboService {

    ComboRepository comboRepository;

    ComboMapper comboMapper;

    public ComboResponse createCombo(ComboCreationRequest request) {

        if (comboRepository.existsByName(request.getName())) throw new AppException(ErrorCode.COMBO_EXISTED);

        Combo combo = comboMapper.toCombo(request);

        return comboMapper.toComboResponse(comboRepository.save(combo));
    }

    public List<ComboResponse> getCombos() {
        return comboRepository.findAll().stream()
                .map(comboMapper::toComboResponse)
                .toList();
    }

    public ComboResponse getCombo(String comboId) {
        return comboMapper.toComboResponse(
                comboRepository.findById(comboId).orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_EXISTED)));
    }

    public void deleteCombo(String comboId) {
        comboRepository.deleteById(comboId);
    }

    public ComboResponse updateCombo(String comboId, ComboUpdateRequest request) {
        Combo combo =
                comboRepository.findById(comboId).orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_EXISTED));

        comboMapper.updateCombo(combo, request);

        return comboMapper.toComboResponse(comboRepository.save(combo));
    }
}
