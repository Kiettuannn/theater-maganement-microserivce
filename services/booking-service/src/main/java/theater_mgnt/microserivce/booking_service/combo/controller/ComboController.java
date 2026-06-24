package theater_mgnt.microserivce.booking_service.combo.controller;


import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.combo.dto.request.ComboCreationRequest;
import theater_mgnt.microserivce.booking_service.combo.dto.request.ComboUpdateRequest;
import theater_mgnt.microserivce.booking_service.combo.dto.response.ComboResponse;
import theater_mgnt.microserivce.booking_service.combo.service.ComboService;
import theater_mgnt.microserivce.booking_service.common.dto.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/combos")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ComboController {
    ComboService comboService;

    @PostMapping
    ApiResponse<ComboResponse> createCombo(@RequestBody @Valid ComboCreationRequest request) {
        return ApiResponse.<ComboResponse>builder()
                .result(comboService.createCombo(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<ComboResponse>> getCombos() {
        return ApiResponse.<List<ComboResponse>>builder()
                .result(comboService.getCombos())
                .build();
    }

    @GetMapping("/{comboId}")
    ApiResponse<ComboResponse> getCombo(@PathVariable("comboId") String comboId) {
        return ApiResponse.<ComboResponse>builder()
                .result(comboService.getCombo(comboId))
                .build();
    }

    @DeleteMapping("/{comboId}")
    ApiResponse<String> deleteCombo(@PathVariable("comboId") String comboId) {
        comboService.deleteCombo(comboId);
        return ApiResponse.<String>builder().result("Delete combo successfully").build();
    }

    @PutMapping("/{comboId}")
    ApiResponse<ComboResponse> updateUser(
            @PathVariable String comboId, @RequestBody @Valid ComboUpdateRequest request) {
        return ApiResponse.<ComboResponse>builder()
                .result(comboService.updateCombo(comboId, request))
                .build();
    }
}
