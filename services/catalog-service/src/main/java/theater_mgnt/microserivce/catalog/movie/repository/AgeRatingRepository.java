package theater_mgnt.microserivce.catalog.movie.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import theater_mgnt.microserivce.catalog.movie.entity.AgeRating;

public interface AgeRatingRepository extends JpaRepository<AgeRating, String> {
    Optional<AgeRating> findByCode(String code);
}

