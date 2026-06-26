package theater_mgnt.microserivce.catalog.priceConfig.controller;


import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.catalog.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.catalog.priceConfig.dto.request.PriceConfigCreationRequest;
import theater_mgnt.microserivce.catalog.priceConfig.dto.request.PriceConfigUpdateRequest;
import theater_mgnt.microserivce.catalog.priceConfig.dto.response.PriceConfigResponse;
import theater_mgnt.microserivce.catalog.priceConfig.service.PriceConfigService;

import java.util.List;

@RestController
@RequestMapping("/priceConfigs")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PriceConfigController {
    PriceConfigService priceConfigService;

    @PostMapping
    ApiResponse<PriceConfigResponse> createPriceConfig(@RequestBody @Valid PriceConfigCreationRequest request) {
        return ApiResponse.<PriceConfigResponse>builder()
                .result(priceConfigService.createPriceConfig(request))
                .build();
    }

    @GetMapping("/seatType/{seatTypeId}")
    ApiResponse<List<PriceConfigResponse>> getPriceConfigsBySeatType(@PathVariable String seatTypeId) {
        return ApiResponse.<List<PriceConfigResponse>>builder()
                .result(priceConfigService.getPriceConfigsBySeatType(seatTypeId))
                .build();
    }

    @GetMapping("/{priceConfigId}")
    ApiResponse<PriceConfigResponse> getPriceConfig(@PathVariable String priceConfigId) {
        return ApiResponse.<PriceConfigResponse>builder()
                .result(priceConfigService.getPriceConfig(priceConfigId))
                .build();
    }

    @GetMapping
    ApiResponse<List<PriceConfigResponse>> getPriceConfigs() {
        return ApiResponse.<List<PriceConfigResponse>>builder()
                .result(priceConfigService.getPriceConfigs())
                .build();
    }

    @PutMapping("/{priceConfigId}")
    ApiResponse<PriceConfigResponse> updatePriceConfig(
            @PathVariable String priceConfigId, @RequestBody @Valid PriceConfigUpdateRequest request) {
        return ApiResponse.<PriceConfigResponse>builder()
                .result(priceConfigService.updatePriceConfig(priceConfigId, request))
                .build();
    }

    @DeleteMapping("/{priceConfigId}")
    ApiResponse<String> deletePriceConfig(@PathVariable String priceConfigId) {
        priceConfigService.deletePriceConfig(priceConfigId);
        return ApiResponse.<String>builder()
                .result("Delete PriceConfig successfully")
                .build();
    }
}
