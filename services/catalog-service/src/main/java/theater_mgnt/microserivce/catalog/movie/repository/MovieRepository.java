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

    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.genres LEFT JOIN FETCH m.ageRating WHERE m.id = :id")
    Optional<Movie> findByIdWithGenres(@Param("id") String id);

    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.genres LEFT JOIN FETCH m.ageRating WHERE m.slug = :slug")
    Optional<Movie> findBySlugWithGenres(@Param("slug") String slug);

    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.genres LEFT JOIN FETCH m.ageRating WHERE m.status = :status AND m.deleted = false")
    List<Movie> findNowShowingMovies(@Param("status") MovieStatus status);

    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.genres LEFT JOIN FETCH m.ageRating WHERE m.status = :status AND m.deleted = false")
    List<Movie> findComingSoonMovies(@Param("status") MovieStatus status);

    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.genres LEFT JOIN FETCH m.ageRating")
    List<Movie> findAllWithGenres();

    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.genres LEFT JOIN FETCH m.ageRating WHERE LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    List<Movie> findByTitleContainingIgnoreCase(@Param("title") String title);

    @Query("SELECT DISTINCT m FROM Movie m JOIN FETCH m.genres g LEFT JOIN FETCH m.ageRating WHERE g.id = :genreId")
    List<Movie> findByGenreId(@Param("genreId") String genreId);

    List<Movie> findByDirectorContainingIgnoreCase(String director);
}
