package theater_mgnt.microserivce.catalog.combo.controller;


import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.catalog.combo.dto.request.ComboItemCreationRequest;
import theater_mgnt.microserivce.catalog.combo.dto.request.ComboItemUpdateRequest;
import theater_mgnt.microserivce.catalog.combo.dto.response.ComboItemResponse;
import theater_mgnt.microserivce.catalog.combo.service.ComboItemService;
import theater_mgnt.microserivce.catalog.common.dto.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/comboItems")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ComboItemController {
    ComboItemService comboItemService;

    @PostMapping
    ApiResponse<ComboItemResponse> createComboItem(@RequestBody @Valid ComboItemCreationRequest request) {
        return ApiResponse.<ComboItemResponse>builder()
                .result(comboItemService.createComboItem(request))
                .build();
    }

    @GetMapping("/combo/{comboId}")
    ApiResponse<List<ComboItemResponse>> getComboItemsByCombo(@PathVariable String comboId) {
        return ApiResponse.<List<ComboItemResponse>>builder()
                .result(comboItemService.getComboItemsByCombo(comboId))
                .build();
    }

    @GetMapping("/{comboItemId}")
    ApiResponse<ComboItemResponse> getComboItem(@PathVariable String comboItemId) {
        return ApiResponse.<ComboItemResponse>builder()
                .result(comboItemService.getComboItem(comboItemId))
                .build();
    }

    @GetMapping
    ApiResponse<List<ComboItemResponse>> getComboItems() {
        return ApiResponse.<List<ComboItemResponse>>builder()
                .result(comboItemService.getComboItems())
                .build();
    }

    @PutMapping("/{comboItemId}")
    ApiResponse<ComboItemResponse> updateComboItem(
            @PathVariable String comboItemId, @RequestBody @Valid ComboItemUpdateRequest request) {
        return ApiResponse.<ComboItemResponse>builder()
                .result(comboItemService.updateComboItem(comboItemId, request))
                .build();
    }

    @DeleteMapping("/{comboItemId}")
    ApiResponse<String> deleteComboItem(@PathVariable String comboItemId) {
        comboItemService.deleteComboItem(comboItemId);
        return ApiResponse.<String>builder()
                .result("Delete ComboItem successfully")
                .build();
    }
}
