package theater_mgnt.microserivce.catalog.priceConfig.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.priceConfig.dto.request.PriceConfigCreationRequest;
import theater_mgnt.microserivce.catalog.priceConfig.dto.request.PriceConfigUpdateRequest;
import theater_mgnt.microserivce.catalog.priceConfig.dto.response.PriceConfigResponse;
import theater_mgnt.microserivce.catalog.priceConfig.entity.PriceConfig;
import theater_mgnt.microserivce.catalog.priceConfig.mapper.PriceConfigMapper;
import theater_mgnt.microserivce.catalog.priceConfig.repository.PriceConfigRepository;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;
import theater_mgnt.microserivce.catalog.seatType.repository.SeatTypeRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PriceConfigService {
    PriceConfigRepository priceConfigRepository;
    SeatTypeRepository seatTypeRepository;
    PriceConfigMapper priceConfigMapper;

    public PriceConfigResponse createPriceConfig(PriceConfigCreationRequest request) {
        SeatType seatType = seatTypeRepository
                .findById(request.getSeatTypeId())
                .orElseThrow(() -> new AppException(ErrorCode.SEATTYPE_NOT_EXISTED));

        PriceConfig priceConfig = priceConfigMapper.toPriceConfig(request);
        priceConfig.setSeatType(seatType);

        return priceConfigMapper.toPriceConfigResponse(priceConfigRepository.save(priceConfig));
    }

    public List<PriceConfigResponse> getPriceConfigsBySeatType(String seatTypeId) {
        return priceConfigRepository.findBySeatTypeId(seatTypeId).stream()
                .map(priceConfigMapper::toPriceConfigResponse)
                .toList();
    }

    public List<PriceConfigResponse> getPriceConfigs() {
        return priceConfigRepository.findAll().stream()
                .map(priceConfigMapper::toPriceConfigResponse)
                .toList();
    }

    public PriceConfigResponse getPriceConfig(String priceConfigId) {
        PriceConfig priceConfig = priceConfigRepository
                .findById(priceConfigId)
                .orElseThrow(() -> new AppException(ErrorCode.PRICECONFIG_NOT_EXISTED));
        return priceConfigMapper.toPriceConfigResponse(priceConfig);
    }

    public PriceConfigResponse updatePriceConfig(String priceConfigId, PriceConfigUpdateRequest request) {
        PriceConfig priceConfig = priceConfigRepository
                .findById(priceConfigId)
                .orElseThrow(() -> new AppException(ErrorCode.PRICECONFIG_NOT_EXISTED));

        priceConfigMapper.updatePriceConfig(priceConfig, request);
        return priceConfigMapper.toPriceConfigResponse(priceConfigRepository.save(priceConfig));
    }

    public void deletePriceConfig(String priceConfigId) {
        if (!priceConfigRepository.existsById(priceConfigId)) throw new AppException(ErrorCode.PRICECONFIG_NOT_EXISTED);
        priceConfigRepository.deleteById(priceConfigId);
    }
}
