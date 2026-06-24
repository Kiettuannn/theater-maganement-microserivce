package theater_mgnt.microserivce.catalog.movie.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import theater_mgnt.microserivce.catalog.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.catalog.movie.dto.request.CreateAgeRatingRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.AgeRatingResponse;
import theater_mgnt.microserivce.catalog.movie.service.AgeRatingService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/age_ratings")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AgeRatingController {

    AgeRatingService ageRatingService;

    @PostMapping
    ApiResponse<AgeRatingResponse> createAgeRating(@Valid @RequestBody CreateAgeRatingRequest request) {
        return ApiResponse.<AgeRatingResponse>builder()
                .result(ageRatingService.createAgeRating(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<AgeRatingResponse>> getAllAgeRatings() {
        return ApiResponse.<List<AgeRatingResponse>>builder()
                .result(ageRatingService.getAllAgeRatings())
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<AgeRatingResponse> getAgeRatingById(@PathVariable("id") String id) {
        return ApiResponse.<AgeRatingResponse>builder()
                .result(ageRatingService.getAgeRatingById(id))
                .build();
    }

    @GetMapping("/code/{code}")
    ApiResponse<AgeRatingResponse> getAgeRatingByCode(@PathVariable("code") String code) {
        return ApiResponse.<AgeRatingResponse>builder()
                .result(ageRatingService.getAgeRatingByCode(code))
                .build();
    }
}
