package theater_mgnt.microserivce.booking_service.outbox.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import theater_mgnt.microserivce.booking_service.outbox.enums.OutboxStatus;

import java.time.Instant;

/**
 * Transactional Outbox record (spec §2.2 — BookingOutbox).
 *
 * Written within the SAME DB transaction as the business operation.
 * A relay process (OutboxRelayService) polls PENDING records and publishes to Kafka,
 * then marks them PUBLISHED — guaranteeing at-least-once delivery.
 */
@Entity
@Table(
    name = "booking_outbox",
    indexes = {
        @Index(name = "ix_outbox_status_created", columnList = "status, created_at")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    /** Domain aggregate — e.g. "Booking" */
    @Column(name = "aggregate_type", nullable = false, length = 64)
    String aggregateType;

    /** ID of the aggregate that raised the event */
    @Column(name = "aggregate_id", nullable = false, length = 36)
    String aggregateId;

    /** e.g. "booking.confirmed", "booking.created" */
    @Column(name = "event_type", nullable = false, length = 128)
    String eventType;

    /** Full event payload as JSON string */
    @Column(nullable = false, columnDefinition = "TEXT")
    String payload;

    /** Target Kafka topic */
    @Column(name = "kafka_topic", nullable = false, length = 255)
    String kafkaTopic;

    /** cinema_id or showtime_id — for even Kafka partition distribution */
    @Column(name = "partition_key", nullable = false, length = 64)
    String partitionKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    OutboxStatus status = OutboxStatus.PENDING;

    /** Number of publish attempts (for retry backoff) */
    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    Short attemptCount = 0;

    /** Timestamp when successfully published to Kafka */
    @Column(name = "published_at")
    Instant publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;
}
