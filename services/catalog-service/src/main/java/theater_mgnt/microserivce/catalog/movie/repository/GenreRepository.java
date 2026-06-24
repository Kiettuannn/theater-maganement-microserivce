package theater_mgnt.microserivce.catalog.movie.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import theater_mgnt.microserivce.catalog.movie.entity.Genre;

public interface GenreRepository extends JpaRepository<Genre, String> {
    Optional<Genre> findByName(String name);
}

