package theater_mgnt.microserivce.booking_service.idempotency.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import theater_mgnt.microserivce.booking_service.idempotency.entity.BookingIdempotencyKey;

import java.time.Instant;
import java.util.Optional;

public interface BookingIdempotencyKeyRepository extends JpaRepository<BookingIdempotencyKey, String> {

    Optional<BookingIdempotencyKey> findByIdempotencyKeyAndUserId(String idempotencyKey, String userId);

    /** Delete expired records (called by scheduler) */
    @Modifying
    @Query("DELETE FROM BookingIdempotencyKey k WHERE k.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
