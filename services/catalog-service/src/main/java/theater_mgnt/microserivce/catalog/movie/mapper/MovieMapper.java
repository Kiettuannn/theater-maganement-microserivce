package theater_mgnt.microserivce.catalog.movie.mapper;

import org.mapstruct.*;

import theater_mgnt.microserivce.catalog.movie.dto.request.CreateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.request.UpdateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.MovieResponse;
import theater_mgnt.microserivce.catalog.movie.entity.AgeRating;
import theater_mgnt.microserivce.catalog.movie.entity.Genre;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        builder = @Builder(disableBuilder = true))
public interface MovieMapper {

    @Mapping(target = "ageRating", ignore = true)
    @Mapping(target = "genres", ignore = true)
    Movie toMovie(CreateMovieRequest request);

    @Mapping(target = "ageRating", ignore = true)
    @Mapping(target = "genres", ignore = true)
    void updateMovieFromRequest(UpdateMovieRequest request, @MappingTarget Movie movie);

    MovieResponse toMovieResponse(Movie movie);

}

