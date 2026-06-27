package theater_mgnt.microserivce.booking_service.idempotency.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import theater_mgnt.microserivce.booking_service.idempotency.dto.IdempotencyCheckResult;
import theater_mgnt.microserivce.booking_service.idempotency.entity.BookingIdempotencyKey;
import theater_mgnt.microserivce.booking_service.idempotency.repository.BookingIdempotencyKeyRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Idempotency Service (spec §2.2 — BookingIdempotencyKey / §5.3 step 1).
 *
 * Usage in BookingService:
 *   1. Call check(key, userId, requestJson) before processing.
 *   2. If duplicate → return cached response.
 *   3. If IDEMPOTENCY_KEY_CONFLICT (same key, different hash) → throw 409.
 *   4. After successful processing, call store(key, userId, requestJson, bookingId, status, responseBody).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final BookingIdempotencyKeyRepository repository;
    private final ObjectMapper objectMapper;

    /**
     * Check whether this idempotency key was already processed for this user.
     * @return IdempotencyCheckResult with duplicate=true if found; false if new.
     * @throws IllegalStateException if same key is reused with a different request body.
     */
    @Transactional(readOnly = true)
    public IdempotencyCheckResult check(String idempotencyKey, String userId, String requestJson) {
        Optional<BookingIdempotencyKey> existing =
                repository.findByIdempotencyKeyAndUserId(idempotencyKey, userId);

        if (existing.isEmpty()) {
            return IdempotencyCheckResult.builder().duplicate(false).build();
        }

        BookingIdempotencyKey record = existing.get();
        String incomingHash = sha256(requestJson);

        if (!incomingHash.equals(record.getRequestHash())) {
            // Same key, different payload → conflict
            throw new IllegalStateException("IDEMPOTENCY_KEY_CONFLICT");
        }

        // Exact duplicate — return cached response
        return IdempotencyCheckResult.builder()
                .duplicate(true)
                .bookingId(record.getBookingId())
                .responseStatus(record.getResponseStatus())
                .responseBody(record.getResponseBody())
                .expiresAt(record.getExpiresAt())
                .build();
    }

    /**
     * Persist the idempotency record WITHIN the same transaction as the booking.
     * Call this after the booking is saved successfully.
     */
    @Transactional
    public void store(String idempotencyKey, String userId, String requestJson,
                      String bookingId, int httpStatus, String responseBody) {
        repository.save(BookingIdempotencyKey.builder()
                .idempotencyKey(idempotencyKey)
                .userId(userId)
                .requestHash(sha256(requestJson))
                .bookingId(bookingId)
                .responseStatus((short) httpStatus)
                .responseBody(responseBody)
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build());
    }

    /** Scheduled cleanup — delete expired records daily */
    @Scheduled(cron = "0 0 3 * * *") // every day at 03:00
    @Transactional
    public void cleanupExpired() {
        int deleted = repository.deleteExpired(Instant.now());
        log.info("Cleaned up {} expired idempotency keys", deleted);
    }

    @SneakyThrows
    private String sha256(String input) {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
