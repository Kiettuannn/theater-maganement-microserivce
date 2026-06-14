package theater_mgnt.microserivce.catalog.seatType.service;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.seatType.dto.request.SeatTypeCreationRequest;
import theater_mgnt.microserivce.catalog.seatType.dto.request.SeatTypeUpdateRequest;
import theater_mgnt.microserivce.catalog.seatType.dto.response.SeatTypeResponse;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;
import theater_mgnt.microserivce.catalog.seatType.mapper.SeatTypeMapper;
import theater_mgnt.microserivce.catalog.seatType.repository.SeatTypeRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatTypeService {

    SeatTypeRepository seatTypeRepository;

    SeatTypeMapper seatTypeMapper;

    public SeatTypeResponse createSeatType(SeatTypeCreationRequest request) {

        if (seatTypeRepository.existsByTypeName(request.getTypeName()))
            throw new AppException(ErrorCode.SEATTYPE_EXISTED);

        SeatType seatType = seatTypeMapper.toSeatType(request);

        return seatTypeMapper.toSeatTypeResponse(seatTypeRepository.save(seatType));
    }

    public List<SeatTypeResponse> getSeatTypes() {
        return seatTypeRepository.findAll().stream()
                .map(seatTypeMapper::toSeatTypeResponse)
                .toList();
    }

    public SeatTypeResponse getSeatType(String seatTypeId) {
        return seatTypeMapper.toSeatTypeResponse(seatTypeRepository
                .findById(seatTypeId)
                .orElseThrow(() -> new AppException(ErrorCode.SEATTYPE_NOT_EXISTED)));
    }

    public void deleteSeatType(String seatTypeId) {
        seatTypeRepository.deleteById(seatTypeId);
    }

    public SeatTypeResponse updateSeatType(String seatTypeId, SeatTypeUpdateRequest request) {
        SeatType seatType = seatTypeRepository
                .findById(seatTypeId)
                .orElseThrow(() -> new AppException(ErrorCode.SEATTYPE_NOT_EXISTED));

        seatTypeMapper.updateSeatType(seatType, request);

        return seatTypeMapper.toSeatTypeResponse(seatTypeRepository.save(seatType));
    }
}
