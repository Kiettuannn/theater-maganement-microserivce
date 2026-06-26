package theater_mgnt.microserivce.booking_service.outbox.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import theater_mgnt.microserivce.booking_service.outbox.entity.BookingOutbox;
import theater_mgnt.microserivce.booking_service.outbox.enums.OutboxStatus;

import java.time.Instant;
import java.util.List;

public interface BookingOutboxRepository extends JpaRepository<BookingOutbox, String> {

    /** Fetch next batch of PENDING records ordered by creation time — for relay polling */
    List<BookingOutbox> findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus status);

    List<BookingOutbox> findByAggregateIdAndEventType(String aggregateId, String eventType);

    @Modifying
    @Query("UPDATE BookingOutbox o SET o.status = 'PUBLISHED', o.publishedAt = :now WHERE o.id = :id")
    void markPublished(@Param("id") String id, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE BookingOutbox o SET o.status = 'FAILED', o.attemptCount = o.attemptCount + 1 WHERE o.id = :id")
    void markFailed(@Param("id") String id);

    @Modifying
    @Query("UPDATE BookingOutbox o SET o.attemptCount = o.attemptCount + 1 WHERE o.id = :id")
    void incrementAttempt(@Param("id") String id);
}
