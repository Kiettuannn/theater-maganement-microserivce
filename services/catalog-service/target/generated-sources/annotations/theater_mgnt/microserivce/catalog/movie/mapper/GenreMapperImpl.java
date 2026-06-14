package theater_mgnt.microserivce.catalog.movie.mapper;

import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.movie.dto.request.CreateGenreRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.GenreResponse;
import theater_mgnt.microserivce.catalog.movie.entity.Genre;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-12T16:06:57+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class GenreMapperImpl implements GenreMapper {

    @Override
    public GenreResponse toGenreResponse(Genre genre) {
        if ( genre == null ) {
            return null;
        }

        GenreResponse.GenreResponseBuilder genreResponse = GenreResponse.builder();

        genreResponse.id( genre.getId() );
        genreResponse.name( genre.getName() );

        genreResponse.movieCount( genre.getMovies() != null ? genre.getMovies().size() : 0 );

        return genreResponse.build();
    }

    @Override
    public List<GenreResponse> toGenreResponseList(List<Genre> genres) {
        if ( genres == null ) {
            return null;
        }

        List<GenreResponse> list = new ArrayList<GenreResponse>( genres.size() );
        for ( Genre genre : genres ) {
            list.add( toGenreResponse( genre ) );
        }

        return list;
    }

    @Override
    public Genre toGenre(CreateGenreRequest request) {
        if ( request == null ) {
            return null;
        }

        Genre.GenreBuilder genre = Genre.builder();

        genre.name( request.getName() );

        return genre.build();
    }
}
