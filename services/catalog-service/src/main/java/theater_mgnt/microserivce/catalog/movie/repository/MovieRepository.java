package theater_mgnt.microserivce.catalog.movie.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import theater_mgnt.microserivce.catalog.movie.entity.Movie;
import theater_mgnt.microserivce.catalog.common.enums.MovieStatus;

@Repository
public interface MovieRepository extends JpaRepository<Movie, String> {

    Optional<Movie> findBySlug(String slug);

    List<Movie> findByStatus(MovieStatus status);

    @Query("SELECT m FROM Movie m WHERE m.status = :status")
    List<Movie> findNowShowingMovies(@Param("status") MovieStatus status);

    @Query("SELECT m FROM Movie m WHERE m.status = :status")
    List<Movie> findComingSoonMovies(@Param("status") MovieStatus status);

    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.genres LEFT JOIN FETCH m.ageRating")
    List<Movie> findAllWithGenres();

    List<Movie> findByTitleContainingIgnoreCase(String title);

    @Query("SELECT DISTINCT m FROM Movie m JOIN FETCH m.genres g WHERE g.id = :genreId")
    List<Movie> findByGenreId(@Param("genreId") String genreId);

    List<Movie> findByDirectorContainingIgnoreCase(String director);
}

