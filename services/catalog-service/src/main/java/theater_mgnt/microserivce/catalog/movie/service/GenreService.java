package theater_mgnt.microserivce.catalog.movie.service;

import java.util.List;

import org.springframework.stereotype.Service;

import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.movie.dto.request.CreateGenreRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.GenreResponse;
import theater_mgnt.microserivce.catalog.movie.entity.Genre;
import theater_mgnt.microserivce.catalog.movie.mapper.GenreMapper;
import theater_mgnt.microserivce.catalog.movie.repository.GenreRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GenreService {

    GenreRepository genreRepository;
    GenreMapper genreMapper;

    // CREATE
    public GenreResponse createGenre(CreateGenreRequest request) {

        if (genreRepository.findByName(request.getName()).isPresent()) {
            throw new AppException(ErrorCode.GENRE_NAME_EXISTED);
        }

        Genre genre = genreMapper.toGenre(request);
        Genre savedGenre = genreRepository.save(genre);
        log.info("Created genre with id: {}", savedGenre.getId());
        return genreMapper.toGenreResponse(savedGenre);
    }

    // READ
    public List<GenreResponse> getAllGenres() {
        List<Genre> genres = genreRepository.findAll();
        return genreMapper.toGenreResponseList(genres);
    }

    public GenreResponse getGenreById(String id) {
        Genre genre = genreRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.GENRE_NOT_EXISTED));
        return genreMapper.toGenreResponse(genre);
    }

    public GenreResponse getGenreByName(String name) {
        Genre genre = genreRepository.findByName(name).orElseThrow(() -> new AppException(ErrorCode.GENRE_NOT_EXISTED));
        return genreMapper.toGenreResponse(genre);
    }
}

