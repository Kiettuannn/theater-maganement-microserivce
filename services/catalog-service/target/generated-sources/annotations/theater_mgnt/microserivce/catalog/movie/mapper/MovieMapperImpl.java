package theater_mgnt.microserivce.catalog.movie.mapper;

import java.util.LinkedHashSet;
import java.util.Set;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.movie.dto.request.CreateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.request.UpdateMovieRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.MovieResponse;
import theater_mgnt.microserivce.catalog.movie.dto.response.MovieSimpleResponse;
import theater_mgnt.microserivce.catalog.movie.entity.AgeRating;
import theater_mgnt.microserivce.catalog.movie.entity.Genre;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-12T16:06:57+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Eclipse Adoptium)"
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
        movieResponse.setAgeRating( toAgeRatingInfo( movie.getAgeRating() ) );
        movieResponse.setGenres( genreSetToGenreInfoSet( movie.getGenres() ) );
        movieResponse.setCreatedAt( movie.getCreatedAt() );
        movieResponse.setUpdatedAt( movie.getUpdatedAt() );

        return movieResponse;
    }

    @Override
    public MovieSimpleResponse toMovieSimpleResponse(Movie movie) {
        if ( movie == null ) {
            return null;
        }

        MovieSimpleResponse movieSimpleResponse = new MovieSimpleResponse();

        movieSimpleResponse.setAgeRatingCode( movieAgeRatingCode( movie ) );
        movieSimpleResponse.setId( movie.getId() );
        movieSimpleResponse.setTitle( movie.getTitle() );
        movieSimpleResponse.setSlug( movie.getSlug() );
        movieSimpleResponse.setPosterUrl( movie.getPosterUrl() );
        movieSimpleResponse.setTrailerUrl( movie.getTrailerUrl() );
        movieSimpleResponse.setDurationMinutes( movie.getDurationMinutes() );
        movieSimpleResponse.setReleaseDate( movie.getReleaseDate() );
        movieSimpleResponse.setStatus( movie.getStatus() );
        movieSimpleResponse.setDirector( movie.getDirector() );
        movieSimpleResponse.setGenres( genreSetToGenreInfoSet1( movie.getGenres() ) );

        return movieSimpleResponse;
    }

    @Override
    public MovieResponse.AgeRatingInfo toAgeRatingInfo(AgeRating ageRating) {
        if ( ageRating == null ) {
            return null;
        }

        MovieResponse.AgeRatingInfo ageRatingInfo = new MovieResponse.AgeRatingInfo();

        ageRatingInfo.setId( ageRating.getId() );
        ageRatingInfo.setCode( ageRating.getCode() );
        ageRatingInfo.setDescription( ageRating.getDescription() );

        return ageRatingInfo;
    }

    @Override
    public MovieResponse.GenreInfo toGenreInfo(Genre genre) {
        if ( genre == null ) {
            return null;
        }

        MovieResponse.GenreInfo genreInfo = new MovieResponse.GenreInfo();

        genreInfo.setId( genre.getId() );
        genreInfo.setName( genre.getName() );

        return genreInfo;
    }

    protected Set<MovieResponse.GenreInfo> genreSetToGenreInfoSet(Set<Genre> set) {
        if ( set == null ) {
            return null;
        }

        Set<MovieResponse.GenreInfo> set1 = new LinkedHashSet<MovieResponse.GenreInfo>( Math.max( (int) ( set.size() / .75f ) + 1, 16 ) );
        for ( Genre genre : set ) {
            set1.add( toGenreInfo( genre ) );
        }

        return set1;
    }

    private String movieAgeRatingCode(Movie movie) {
        if ( movie == null ) {
            return null;
        }
        AgeRating ageRating = movie.getAgeRating();
        if ( ageRating == null ) {
            return null;
        }
        String code = ageRating.getCode();
        if ( code == null ) {
            return null;
        }
        return code;
    }

    protected MovieSimpleResponse.GenreInfo genreToGenreInfo(Genre genre) {
        if ( genre == null ) {
            return null;
        }

        MovieSimpleResponse.GenreInfo genreInfo = new MovieSimpleResponse.GenreInfo();

        genreInfo.setId( genre.getId() );
        genreInfo.setName( genre.getName() );

        return genreInfo;
    }

    protected Set<MovieSimpleResponse.GenreInfo> genreSetToGenreInfoSet1(Set<Genre> set) {
        if ( set == null ) {
            return null;
        }

        Set<MovieSimpleResponse.GenreInfo> set1 = new LinkedHashSet<MovieSimpleResponse.GenreInfo>( Math.max( (int) ( set.size() / .75f ) + 1, 16 ) );
        for ( Genre genre : set ) {
            set1.add( genreToGenreInfo( genre ) );
        }

        return set1;
    }
}
