package theater_mgnt.microserivce.catalog.movie.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import theater_mgnt.microserivce.catalog.movie.dto.request.CreateGenreRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.GenreResponse;
import theater_mgnt.microserivce.catalog.movie.entity.Genre;

@Mapper(componentModel = "spring")
public interface GenreMapper {
    GenreResponse toGenreResponse(Genre genre);

    List<GenreResponse> toGenreResponseList(List<Genre> genres);

    Genre toGenre(CreateGenreRequest request);
}

