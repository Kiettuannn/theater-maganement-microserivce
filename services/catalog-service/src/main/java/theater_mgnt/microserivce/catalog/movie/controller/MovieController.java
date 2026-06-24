package theater_mgnt.microserivce.catalog.movie.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import theater_mgnt.microserivce.catalog.common.dto.response.ApiResponse;

import theater_mgnt.microserivce.catalog.movie.dto.request.CreateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.request.UpdateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.MovieResponse;
import theater_mgnt.microserivce.catalog.movie.dto.response.MovieSimpleResponse;
import theater_mgnt.microserivce.catalog.common.enums.MovieStatus;
import theater_mgnt.microserivce.catalog.movie.service.MovieService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MovieController {

    MovieService movieService;

    // ========== CREATE ==========

    @PostMapping
    ApiResponse<MovieResponse> createMovie(@Valid @RequestBody CreateMovieRequest request) {
        MovieResponse response = movieService.createMovie(request);
        return ApiResponse.<MovieResponse>builder().result(response).build();
    }

    // ========== READ ==========

    @GetMapping
    ApiResponse<List<MovieSimpleResponse>> getAllMovies() {
        return ApiResponse.<List<MovieSimpleResponse>>builder()
                .result(movieService.getAllMovies())
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<MovieResponse> getMovieById(@PathVariable("id") String id) {
        return ApiResponse.<MovieResponse>builder()
                .result(movieService.getMovieById(id))
                .build();
    }

    @GetMapping("/slug/{slug}")
    ApiResponse<MovieResponse> getMovieBySlug(@PathVariable("slug") String slug) {
        return ApiResponse.<MovieResponse>builder()
                .result(movieService.getMovieBySlug(slug))
                .build();
    }

    @GetMapping("/status/{status}")
    ApiResponse<List<MovieSimpleResponse>> getMoviesByStatus(@PathVariable("status") MovieStatus status) {
        return ApiResponse.<List<MovieSimpleResponse>>builder()
                .result(movieService.getMoviesByStatus(status))
                .build();
    }

    @GetMapping("/now-showing")
    ApiResponse<List<MovieSimpleResponse>> getNowShowingMovies() {
        return ApiResponse.<List<MovieSimpleResponse>>builder()
                .result(movieService.getNowShowingMovies())
                .build();
    }

    @GetMapping("/coming-soon")
    ApiResponse<List<MovieSimpleResponse>> getComingSoonMovies() {
        return ApiResponse.<List<MovieSimpleResponse>>builder()
                .result(movieService.getComingSoonMovies())
                .build();
    }

    @GetMapping("/search")
    ApiResponse<List<MovieSimpleResponse>> searchMoviesByTitle(@RequestParam("title") String title) {
        return ApiResponse.<List<MovieSimpleResponse>>builder()
                .result(movieService.searchMoviesByTitle(title))
                .build();
    }

    @GetMapping("/genre/{genreId}")
    ApiResponse<List<MovieSimpleResponse>> getMoviesByGenre(@PathVariable("genreId") String genreId) {
        return ApiResponse.<List<MovieSimpleResponse>>builder()
                .result(movieService.getMoviesByGenre(genreId))
                .build();
    }

    // ========== UPDATE ==========

    @PutMapping("/{id}")
    ApiResponse<MovieResponse> updateMovie(
            @PathVariable("id") String id, @Valid @RequestBody UpdateMovieRequest request) {
        return ApiResponse.<MovieResponse>builder()
                .result(movieService.updateMovie(id, request))
                .build();
    }

    @PatchMapping("/{id}/archive")
    ApiResponse<MovieResponse> archiveMovie(@PathVariable("id") String id) {
        return ApiResponse.<MovieResponse>builder()
                .result(movieService.archiveMovie(id))
                .build();
    }

    // ========== DELETE ==========

    @DeleteMapping("/{id}")
    ApiResponse<String> deleteMovie(@PathVariable("id") String id) {
        movieService.deleteMovie(id);
        return ApiResponse.<String>builder().result("Delete movie successfully").build();
    }
}
