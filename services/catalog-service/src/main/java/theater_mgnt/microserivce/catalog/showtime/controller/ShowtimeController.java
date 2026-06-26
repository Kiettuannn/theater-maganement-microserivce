package theater_mgnt.microserivce.catalog.showtime.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import theater_mgnt.microserivce.catalog.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.catalog.showtime.dto.request.ShowtimeCreationRequest;
import theater_mgnt.microserivce.catalog.showtime.dto.request.ShowtimeUpdateRequest;
import theater_mgnt.microserivce.catalog.showtime.dto.response.ShowtimeDetailResponse;
import theater_mgnt.microserivce.catalog.showtime.dto.response.ShowtimeResponse;
import theater_mgnt.microserivce.catalog.showtime.service.ShowtimeService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/showtimes")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShowtimeController {
    ShowtimeService showtimeService;

    @PostMapping
    ApiResponse<ShowtimeResponse> createShowtime(@RequestBody @Valid ShowtimeCreationRequest request) {
        return ApiResponse.<ShowtimeResponse>builder()
                .result(showtimeService.createShowtime(request))
                .build();
    }

    @GetMapping("/movie/{movieId}")
    ApiResponse<List<ShowtimeResponse>> getShowtimesByMovie(@PathVariable String movieId) {
        return ApiResponse.<List<ShowtimeResponse>>builder()
                .result(showtimeService.getShowtimesByMovieId(movieId))
                .build();
    }

    @GetMapping("/room/{roomId}")
    ApiResponse<List<ShowtimeResponse>> getShowtimesByRoom(@PathVariable String roomId) {
        return ApiResponse.<List<ShowtimeResponse>>builder()
                .result(showtimeService.getShowtimesByRoomId(roomId))
                .build();
    }

    @GetMapping("/{showtimeId}")
    ApiResponse<ShowtimeResponse> getShowtime(@PathVariable String showtimeId) {
        return ApiResponse.<ShowtimeResponse>builder()
                .result(showtimeService.getShowtime(showtimeId))
                .build();
    }

    @GetMapping("/{showtimeId}/detail")
    ApiResponse<ShowtimeDetailResponse> getShowtimeDetail(@PathVariable String showtimeId) {
        return ApiResponse.<ShowtimeDetailResponse>builder()
                .result(showtimeService.getShowtimeDetail(showtimeId))
                .build();
    }

    @GetMapping
    ApiResponse<List<ShowtimeResponse>> getShowtimes() {
        return ApiResponse.<List<ShowtimeResponse>>builder()
                .result(showtimeService.getShowtimes())
                .build();
    }

    @PutMapping("/{showtimeId}")
    ApiResponse<ShowtimeResponse> updateShowtime(
            @PathVariable String showtimeId, @RequestBody @Valid ShowtimeUpdateRequest request) {
        return ApiResponse.<ShowtimeResponse>builder()
                .result(showtimeService.updateShowtime(showtimeId, request))
                .build();
    }

    @DeleteMapping("/{showtimeId}")
    ApiResponse<String> deleteShowtime(@PathVariable String showtimeId) {
        showtimeService.deleteShowtime(showtimeId);
        return ApiResponse.<String>builder()
                .result("Delete showtime successfully")
                .build();
    }
}
