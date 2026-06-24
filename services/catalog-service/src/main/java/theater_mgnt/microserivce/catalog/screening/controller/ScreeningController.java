package theater_mgnt.microserivce.catalog.screening.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import theater_mgnt.microserivce.catalog.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningCreationRequest;
import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningUpdateRequest;
import theater_mgnt.microserivce.catalog.screening.dto.response.ScreeningDetailResponse;
import theater_mgnt.microserivce.catalog.screening.dto.response.ScreeningResponse;
import theater_mgnt.microserivce.catalog.screening.service.ScreeningService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/screenings")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScreeningController {
    ScreeningService screeningService;

    @PostMapping
    ApiResponse<ScreeningResponse> createScreening(@RequestBody @Valid ScreeningCreationRequest request) {
        return ApiResponse.<ScreeningResponse>builder()
                .result(screeningService.createScreening(request))
                .build();
    }

    @GetMapping("/movie/{movieId}")
    ApiResponse<List<ScreeningResponse>> getScreeningsByMovie(@PathVariable String movieId) {
        return ApiResponse.<List<ScreeningResponse>>builder()
                .result(screeningService.getScreeningsByMovieId(movieId))
                .build();
    }

    @GetMapping("/room/{roomId}")
    ApiResponse<List<ScreeningResponse>> getScreeningsByRoom(@PathVariable String roomId) {
        return ApiResponse.<List<ScreeningResponse>>builder()
                .result(screeningService.getScreeningsByRoomId(roomId))
                .build();
    }

    @GetMapping("/{screeningId}")
    ApiResponse<ScreeningResponse> getScreening(@PathVariable String screeningId) {
        return ApiResponse.<ScreeningResponse>builder()
                .result(screeningService.getScreening(screeningId))
                .build();
    }

    @GetMapping("/{screeningId}/detail")
    ApiResponse<ScreeningDetailResponse> getScreeningDetail(@PathVariable String screeningId) {
        return ApiResponse.<ScreeningDetailResponse>builder()
                .result(screeningService.getScreeningDetail(screeningId))
                .build();
    }

    @GetMapping
    ApiResponse<List<ScreeningResponse>> getScreenings() {
        return ApiResponse.<List<ScreeningResponse>>builder()
                .result(screeningService.getScreenings())
                .build();
    }

    @PutMapping("/{screeningId}")
    ApiResponse<ScreeningResponse> updateScreening(
            @PathVariable String screeningId, @RequestBody @Valid ScreeningUpdateRequest request) {
        return ApiResponse.<ScreeningResponse>builder()
                .result(screeningService.updateScreening(screeningId, request))
                .build();
    }

    @DeleteMapping("/{screeningId}")
    ApiResponse<String> deleteScreening(@PathVariable String screeningId) {
        screeningService.deleteScreening(screeningId);
        return ApiResponse.<String>builder()
                .result("Delete screening successfully")
                .build();
    }
}

