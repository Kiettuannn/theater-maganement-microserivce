package theater_mgnt.microserivce.catalog.movie.mapper;

import java.util.LinkedHashSet;
import java.util.Set;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.movie.dto.request.CreateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.request.UpdateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.AgeRatingResponse;
import theater_mgnt.microserivce.catalog.movie.dto.response.GenreResponse;
import theater_mgnt.microserivce.catalog.movie.dto.response.MovieResponse;
import theater_mgnt.microserivce.catalog.movie.entity.AgeRating;
import theater_mgnt.microserivce.catalog.movie.entity.Genre;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-02T14:57:18+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 24.0.2 (Oracle Corporation)"
)
@Component
public class MovieMapperImpl implements MovieMapper {

    @Override
    public Movie toMovie(CreateMovieRequest request) {
        if ( request == null ) {
            return null;
        }

        Movie movie = new Movie();

        movie.setTitle( request.getTitle() );
        movie.setDescription( request.getDescription() );
        movie.setDurationMinutes( request.getDurationMinutes() );
        movie.setDirector( request.getDirector() );
        movie.setCastMembers( request.getCastMembers() );
        movie.setPosterUrl( request.getPosterUrl() );
        movie.setTrailerUrl( request.getTrailerUrl() );
        movie.setReleaseDate( request.getReleaseDate() );
        movie.setEndDate( request.getEndDate() );
        movie.setStatus( request.getStatus() );

        return movie;
    }

    @Override
    public void updateMovieFromRequest(UpdateMovieRequest request, Movie movie) {
        if ( request == null ) {
            return;
        }

        if ( request.getTitle() != null ) {
            movie.setTitle( request.getTitle() );
        }
        if ( request.getDescription() != null ) {
            movie.setDescription( request.getDescription() );
        }
        if ( request.getDurationMinutes() != null ) {
            movie.setDurationMinutes( request.getDurationMinutes() );
        }
        if ( request.getDirector() != null ) {
            movie.setDirector( request.getDirector() );
        }
        if ( request.getCastMembers() != null ) {
            movie.setCastMembers( request.getCastMembers() );
        }
        if ( request.getPosterUrl() != null ) {
            movie.setPosterUrl( request.getPosterUrl() );
        }
        if ( request.getTrailerUrl() != null ) {
            movie.setTrailerUrl( request.getTrailerUrl() );
        }
        if ( request.getReleaseDate() != null ) {
            movie.setReleaseDate( request.getReleaseDate() );
        }
        if ( request.getEndDate() != null ) {
            movie.setEndDate( request.getEndDate() );
        }
        if ( request.getStatus() != null ) {
            movie.setStatus( request.getStatus() );
        }
    }

    @Override
    public MovieResponse toMovieResponse(Movie movie) {
        if ( movie == null ) {
            return null;
        }

        MovieResponse movieResponse = new MovieResponse();

        movieResponse.setId( movie.getId() );
        movieResponse.setTitle( movie.getTitle() );
        movieResponse.setSlug( movie.getSlug() );
        movieResponse.setDescription( movie.getDescription() );
        movieResponse.setDurationMinutes( movie.getDurationMinutes() );
        movieResponse.setDirector( movie.getDirector() );
        movieResponse.setCastMembers( movie.getCastMembers() );
        movieResponse.setPosterUrl( movie.getPosterUrl() );
        movieResponse.setTrailerUrl( movie.getTrailerUrl() );
        movieResponse.setReleaseDate( movie.getReleaseDate() );
        movieResponse.setEndDate( movie.getEndDate() );
        movieResponse.setStatus( movie.getStatus() );
        movieResponse.setAgeRating( ageRatingToAgeRatingResponse( movie.getAgeRating() ) );
        movieResponse.setGenres( genreSetToGenreResponseSet( movie.getGenres() ) );
        movieResponse.setCreatedAt( movie.getCreatedAt() );
        movieResponse.setUpdatedAt( movie.getUpdatedAt() );

        return movieResponse;
    }

    protected AgeRatingResponse ageRatingToAgeRatingResponse(AgeRating ageRating) {
        if ( ageRating == null ) {
            return null;
        }

        AgeRatingResponse ageRatingResponse = new AgeRatingResponse();

        ageRatingResponse.setId( ageRating.getId() );
        ageRatingResponse.setCode( ageRating.getCode() );
        ageRatingResponse.setDescription( ageRating.getDescription() );

        return ageRatingResponse;
    }

    protected GenreResponse genreToGenreResponse(Genre genre) {
        if ( genre == null ) {
            return null;
        }

        GenreResponse genreResponse = new GenreResponse();

        genreResponse.setId( genre.getId() );
        genreResponse.setName( genre.getName() );

        return genreResponse;
    }

    protected Set<GenreResponse> genreSetToGenreResponseSet(Set<Genre> set) {
        if ( set == null ) {
            return null;
        }

        Set<GenreResponse> set1 = new LinkedHashSet<GenreResponse>( Math.max( (int) ( set.size() / .75f ) + 1, 16 ) );
        for ( Genre genre : set ) {
            set1.add( genreToGenreResponse( genre ) );
        }

        return set1;
    }
}
