package theater_mgnt.microserivce.booking_service.outbox.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.outbox.enums.OutboxStatus;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OutboxRecordResponse {
    String id;
    String aggregateType;
    String aggregateId;
    String eventType;
    String kafkaTopic;
    String partitionKey;
    OutboxStatus status;
    Short attemptCount;
    Instant publishedAt;
    Instant createdAt;
}
