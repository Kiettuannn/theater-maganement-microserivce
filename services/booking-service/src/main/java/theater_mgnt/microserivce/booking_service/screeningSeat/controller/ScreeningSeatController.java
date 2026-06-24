package com.theatermgnt.theatermgnt.screeningSeat.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.theatermgnt.theatermgnt.common.dto.response.ApiResponse;
import com.theatermgnt.theatermgnt.screeningSeat.dto.request.ScreeningSeatCreationRequest;
import com.theatermgnt.theatermgnt.screeningSeat.dto.request.ScreeningSeatUpdateRequest;
import com.theatermgnt.theatermgnt.screeningSeat.dto.response.ScreeningSeatResponse;
import com.theatermgnt.theatermgnt.screeningSeat.service.ScreeningSeatService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/screeningSeats")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScreeningSeatController {
    ScreeningSeatService screeningSeatService;

    @PostMapping
    ApiResponse<ScreeningSeatResponse> createScreeningSeat(@RequestBody @Valid ScreeningSeatCreationRequest request) {
        return ApiResponse.<ScreeningSeatResponse>builder()
                .result(screeningSeatService.createScreeningSeat(request))
                .build();
    }

    @GetMapping("/screening/{screeningId}")
    ApiResponse<List<ScreeningSeatResponse>> getScreeningSeatsByScreening(@PathVariable String screeningId) {
        return ApiResponse.<List<ScreeningSeatResponse>>builder()
                .result(screeningSeatService.getScreeningSeatsByScreeningId(screeningId))
                .build();
    }

    @GetMapping("/seat/{seatId}")
    ApiResponse<List<ScreeningSeatResponse>> getScreeningsBySeat(@PathVariable String seatId) {
        return ApiResponse.<List<ScreeningSeatResponse>>builder()
                .result(screeningSeatService.getScreeningSeatsBySeatId(seatId))
                .build();
    }

    @GetMapping("/{screeningSeatId}")
    ApiResponse<ScreeningSeatResponse> getScreeningSeat(@PathVariable String screeningSeatId) {
        return ApiResponse.<ScreeningSeatResponse>builder()
                .result(screeningSeatService.getScreeningSeat(screeningSeatId))
                .build();
    }

    @GetMapping
    ApiResponse<List<ScreeningSeatResponse>> getScreeningSeats() {
        return ApiResponse.<List<ScreeningSeatResponse>>builder()
                .result(screeningSeatService.getScreeningSeats())
                .build();
    }

    @PutMapping("/{screeningSeatId}")
    ApiResponse<ScreeningSeatResponse> updateScreeningSeat(
            @PathVariable String screeningSeatId, @RequestBody @Valid ScreeningSeatUpdateRequest request) {
        return ApiResponse.<ScreeningSeatResponse>builder()
                .result(screeningSeatService.updateScreeningSeat(screeningSeatId, request))
                .build();
    }

    @DeleteMapping("/{screeningSeatId}")
    ApiResponse<String> deleteScreeningSeat(@PathVariable String screeningSeatId) {
        screeningSeatService.deleteScreeningSeat(screeningSeatId);
        return ApiResponse.<String>builder()
                .result("Delete screening seat successfully")
                .build();
    }
}
