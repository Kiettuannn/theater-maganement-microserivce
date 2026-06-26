package theater_mgnt.microserivce.catalog.movie.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import theater_mgnt.microserivce.catalog.movie.dto.request.CreateGenreRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.GenreResponse;
import theater_mgnt.microserivce.catalog.movie.entity.Genre;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GenreMapper {
    @Mapping(target = "movieCount", expression = "java(genre.getMovies() != null ? genre.getMovies().size() : 0)")
    GenreResponse toGenreResponse(Genre genre);

    List<GenreResponse> toGenreResponseList(List<Genre> genres);

    @Mapping(target = "movies", ignore = true)
    Genre toGenre(CreateGenreRequest request);
}

