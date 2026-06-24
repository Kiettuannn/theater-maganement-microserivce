package theater_mgnt.microserivce.catalog.seatType.controller;


import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.catalog.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.catalog.seatType.dto.request.SeatTypeCreationRequest;
import theater_mgnt.microserivce.catalog.seatType.dto.request.SeatTypeUpdateRequest;
import theater_mgnt.microserivce.catalog.seatType.dto.response.SeatTypeResponse;
import theater_mgnt.microserivce.catalog.seatType.service.SeatTypeService;

import java.util.List;

@RestController
@RequestMapping("/seatTypes")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatTypeController {

    SeatTypeService seatTypeService;

    @PostMapping
    ApiResponse<SeatTypeResponse> createSeatType(@RequestBody @Valid SeatTypeCreationRequest request) {
        return ApiResponse.<SeatTypeResponse>builder()
                .result(seatTypeService.createSeatType(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<SeatTypeResponse>> getSeatTypes() {
        return ApiResponse.<List<SeatTypeResponse>>builder()
                .result(seatTypeService.getSeatTypes())
                .build();
    }

    @GetMapping("/{seatTypeId}")
    ApiResponse<SeatTypeResponse> getSeatType(@PathVariable("seatTypeId") String seatTypeId) {
        return ApiResponse.<SeatTypeResponse>builder()
                .result(seatTypeService.getSeatType(seatTypeId))
                .build();
    }

    @DeleteMapping("/{seatTypeId}")
    ApiResponse<String> deleteSeatType(@PathVariable("seatTypeId") String seatTypeId) {
        seatTypeService.deleteSeatType(seatTypeId);
        return ApiResponse.<String>builder()
                .result("Delete seat type successfully")
                .build();
    }

    @PutMapping("/{seatTypeId}")
    ApiResponse<SeatTypeResponse> updateSeatType(
            @PathVariable String seatTypeId, @RequestBody @Valid SeatTypeUpdateRequest request) {
        return ApiResponse.<SeatTypeResponse>builder()
                .result(seatTypeService.updateSeatType(seatTypeId, request))
                .build();
    }
}
