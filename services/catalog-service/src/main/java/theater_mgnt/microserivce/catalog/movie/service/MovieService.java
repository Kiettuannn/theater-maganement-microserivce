package theater_mgnt.microserivce.catalog.movie.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.slugify.Slugify;

import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.movie.dto.request.CreateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.request.UpdateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.MovieResponse;
import theater_mgnt.microserivce.catalog.movie.dto.response.MovieSimpleResponse;
import theater_mgnt.microserivce.catalog.movie.entity.AgeRating;
import theater_mgnt.microserivce.catalog.movie.entity.Genre;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;
import theater_mgnt.microserivce.catalog.common.enums.MovieStatus;
import theater_mgnt.microserivce.catalog.movie.mapper.MovieMapper;
import theater_mgnt.microserivce.catalog.movie.repository.AgeRatingRepository;
import theater_mgnt.microserivce.catalog.movie.repository.GenreRepository;
import theater_mgnt.microserivce.catalog.movie.repository.MovieRepository;
import theater_mgnt.microserivce.catalog.showtime.enums.ShowtimeStatus;
import theater_mgnt.microserivce.catalog.showtime.repository.ShowtimeRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MovieService {

	private static final Slugify SLUGIFY = new Slugify();

    MovieRepository movieRepository;
    AgeRatingRepository ageRatingRepository;
    GenreRepository genreRepository;
    MovieMapper movieMapper;
    ShowtimeRepository showtimeRepository;

    @Transactional
    public MovieResponse createMovie(CreateMovieRequest request) {
        // Validate AgeRating exists
        AgeRating ageRating = ageRatingRepository
                .findById(request.getAgeRatingId())
                .orElseThrow(() -> new AppException(ErrorCode.AGERATING_NOT_EXISTED));

        // Validate Genres exist
        Set<Genre> genres = request.getGenreIds().stream()
                .map(id ->
                        genreRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.GENRE_NOT_EXISTED)))
                .collect(Collectors.toSet());

        // Map and set relationships
        Movie movie = movieMapper.toMovie(request);
        movie.setAgeRating(ageRating);
        movie.setGenres(genres);

        // Generate unique slug
        movie.setSlug(generateUniqueSlug(request.getTitle()));

        // Save and return response
        Movie savedMovie = movieRepository.save(movie);

        return movieMapper.toMovieResponse(savedMovie);
    }

    // ========== READ ==========
    public List<MovieSimpleResponse> getAllMovies() {
        List<Movie> movies = movieRepository.findAllWithGenres();
        return movies.stream()
                .map(movie -> {
                    MovieSimpleResponse response = movieMapper.toMovieSimpleResponse(movie);
                    response.setNeedsArchiveWarning(shouldShowArchiveWarning(movie));
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Cacheable(value = "movie", key = "'id:' + #id")
    public MovieResponse getMovieById(String id) {
        Movie movie = movieRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));
        return movieMapper.toMovieResponse(movie);
    }

    @Cacheable(value = "movie", key = "'slug:' + #slug")
    public MovieResponse getMovieBySlug(String slug) {
        Movie movie = movieRepository.findBySlug(slug).orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));
        return movieMapper.toMovieResponse(movie);
    }

    public List<MovieSimpleResponse> getMoviesByStatus(MovieStatus status) {
        return movieRepository.findByStatus(status).stream()
                .map(movieMapper::toMovieSimpleResponse)
                .collect(Collectors.toList());
    }

    public List<MovieSimpleResponse> getNowShowingMovies() {
        return movieRepository.findNowShowingMovies(MovieStatus.NOW_SHOWING).stream()
                .map(movieMapper::toMovieSimpleResponse)
                .collect(Collectors.toList());
    }

    public List<MovieSimpleResponse> getComingSoonMovies() {
        return movieRepository.findComingSoonMovies(MovieStatus.COMING_SOON).stream()
                .map(movieMapper::toMovieSimpleResponse)
                .collect(Collectors.toList());
    }

    public List<MovieSimpleResponse> searchMoviesByTitle(String title) {
        return movieRepository.findByTitleContainingIgnoreCase(title).stream()
                .map(movieMapper::toMovieSimpleResponse)
                .collect(Collectors.toList());
    }

    public List<MovieSimpleResponse> getMoviesByGenre(String genreId) {
        // Validate Genre exists
        if (!genreRepository.existsById(genreId)) {
            throw new AppException(ErrorCode.GENRE_NOT_EXISTED);
        }

        return movieRepository.findByGenreId(genreId).stream()
                .map(movieMapper::toMovieSimpleResponse)
                .collect(Collectors.toList());
    }

    // ========== UPDATE ==========
    @Transactional
    @CacheEvict(value = "movie", allEntries = true) // xóa tất cả vì title/slug có thể thay đổi
    public MovieResponse updateMovie(String id, UpdateMovieRequest request) {
        Movie movie = movieRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        if (request.getStatus() == MovieStatus.ARCHIVED
                && showtimeRepository.existsByMovieIdAndStatus(id, ShowtimeStatus.SCHEDULED)) {
            throw new AppException(ErrorCode.MOVIE_HAS_SCHEDULED_SCREENINGS);
        }
        // Update basic fields using MapStruct
        movieMapper.updateMovieFromRequest(request, movie);

        // Update slug if title changed
        if (request.getTitle() != null && !request.getTitle().equals(movie.getTitle())) {
            movie.setSlug(generateUniqueSlug(request.getTitle()));
        }

        // Update AgeRating if provided
        if (request.getAgeRatingId() != null) {
            AgeRating ageRating = ageRatingRepository
                    .findById(request.getAgeRatingId())
                    .orElseThrow(() -> new AppException(ErrorCode.AGERATING_NOT_EXISTED));
            movie.setAgeRating(ageRating);
        }

        // Update Genres if provided
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            Set<Genre> genres = request.getGenreIds().stream()
                    .map(genreId -> genreRepository
                            .findById(genreId)
                            .orElseThrow(() -> new AppException(ErrorCode.GENRE_NOT_EXISTED)))
                    .collect(Collectors.toSet());
            movie.setGenres(genres);
        }

        Movie updatedMovie = movieRepository.save(movie);

        return movieMapper.toMovieResponse(updatedMovie);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "movie", key = "'id:' + #id"),
        @CacheEvict(value = "movie", allEntries = true) // xóa toàn bộ movie cache vì slug có thể đã thay đổi
    })
    public MovieResponse archiveMovie(String id) {
        Movie movie = movieRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        if (showtimeRepository.existsByMovieIdAndStatus(id, ShowtimeStatus.SCHEDULED)) {
            throw new AppException(ErrorCode.MOVIE_HAS_SCHEDULED_SCREENINGS);
        }

        movie.setStatus(MovieStatus.ARCHIVED);
        Movie archivedMovie = movieRepository.save(movie);

        return movieMapper.toMovieResponse(archivedMovie);
    }

    private boolean shouldShowArchiveWarning(Movie movie) {
        if (movie.getStatus() != MovieStatus.NOW_SHOWING) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sevenDaysLater = now.plusDays(7);

        return !showtimeRepository.existsByMovieIdAndStartTimeBetween(movie.getId(), now, sevenDaysLater);
    }

    // ========== DELETE ==========
    @Transactional
    @CacheEvict(value = "movie", allEntries = true)
    public void deleteMovie(String movieId) {
        Movie movie =
                movieRepository.findById(movieId).orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        // Không cho xóa phim nếu còn suất chiếu SCHEDULED trong tương lai
        if (showtimeRepository.existsByMovieIdAndStatus(movieId, ShowtimeStatus.SCHEDULED)) {
            throw new AppException(ErrorCode.MOVIE_HAS_SCHEDULED_SCREENINGS);
        }

        movieRepository.delete(movie);
    }

    // ========== SLUG GENERATION ==========
    private String generateUniqueSlug(String title) {
        String baseSlug = SLUGIFY.slugify(title);
        String slug = baseSlug;
        int counter = 0;

        // Check if slug exists, if yes, append counter
        while (movieRepository.findBySlug(slug).isPresent()) {
            counter++;
            slug = baseSlug + "-" + counter;
        }

        return slug;
    }
}

