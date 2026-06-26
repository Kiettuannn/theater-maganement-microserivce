package theater_mgnt.microserivce.booking_service.idempotency.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Idempotency store (spec §2.2 — BookingIdempotencyKey).
 *
 * Prevents duplicate booking requests caused by network retries.
 * The client supplies an idempotency_key (UUID) per request attempt.
 * Records expire after 24 hours and are cleaned up by a scheduler.
 */
@Entity
@Table(name = "booking_idempotency_keys")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingIdempotencyKey {

    /** Client-supplied unique key per request attempt — PRIMARY KEY */
    @Id
    @Column(name = "idempotency_key", nullable = false, length = 36)
    String idempotencyKey;

    /** The booking created for this request */
    @Column(name = "booking_id", nullable = false, length = 36)
    String bookingId;

    /** The user who made the request */
    @Column(name = "user_id", nullable = false, length = 36)
    String userId;

    /** SHA-256 hash of the request body — detects changed payloads on retry */
    @Column(name = "request_hash", nullable = false, length = 64)
    String requestHash;

    /** HTTP status code of the original response */
    @Column(name = "response_status", nullable = false)
    Short responseStatus;

    /** Cached response body to replay on duplicate request */
    @Column(name = "response_body", columnDefinition = "TEXT")
    String responseBody;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    /** TTL — records past this timestamp are eligible for cleanup */
    @Column(name = "expires_at", nullable = false)
    Instant expiresAt;
}
