package theater_mgnt.microserivce.booking_service.idempotency.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IdempotencyCheckResult {
    /** True if this key was already processed */
    boolean duplicate;
    /** The bookingId associated with the original request (null if not duplicate) */
    String bookingId;
    /** Cached HTTP response status */
    Short responseStatus;
    /** Cached response body JSON */
    String responseBody;
    /** When the original record expires */
    Instant expiresAt;
}
