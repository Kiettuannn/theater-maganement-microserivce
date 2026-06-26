package theater_mgnt.microserivce.booking_service.outbox.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import theater_mgnt.microserivce.booking_service.outbox.entity.BookingOutbox;
import theater_mgnt.microserivce.booking_service.outbox.enums.OutboxStatus;
import theater_mgnt.microserivce.booking_service.outbox.repository.BookingOutboxRepository;

import java.time.Instant;
import java.util.List;

/**
 * Outbox Relay Service (spec §2.2 — TransactionalOutbox / §14.8).
 *
 * Polls PENDING outbox records every 5 s, publishes to Kafka, then marks PUBLISHED.
 * Retries on failure (up to 3 attempts before marking FAILED).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxRelayService {

    private static final int MAX_ATTEMPTS = 3;

    private final BookingOutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelay = 5_000)
    @Transactional
    public void relayPendingEvents() {
        List<BookingOutbox> pending = outboxRepository
                .findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);

        if (pending.isEmpty()) return;

        log.debug("Relaying {} PENDING outbox records to Kafka", pending.size());

        for (BookingOutbox record : pending) {
            try {
                kafkaTemplate.send(record.getKafkaTopic(), record.getPartitionKey(), record.getPayload())
                        .get(); // synchronous wait for ack
                outboxRepository.markPublished(record.getId(), Instant.now());
                log.info("Published outbox record {} (type={}, topic={})",
                        record.getId(), record.getEventType(), record.getKafkaTopic());
            } catch (Exception e) {
                log.warn("Failed to publish outbox record {}: {}", record.getId(), e.getMessage());
                outboxRepository.incrementAttempt(record.getId());
                if (record.getAttemptCount() + 1 >= MAX_ATTEMPTS) {
                    outboxRepository.markFailed(record.getId());
                    log.error("Outbox record {} marked FAILED after {} attempts", record.getId(), MAX_ATTEMPTS);
                }
            }
        }
    }

    /** Helper: save an outbox record within the caller's transaction */
    public BookingOutbox save(String aggregateType, String aggregateId,
                               String eventType, String payload,
                               String kafkaTopic, String partitionKey) {
        return outboxRepository.save(BookingOutbox.builder()
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .eventType(eventType)
                .payload(payload)
                .kafkaTopic(kafkaTopic)
                .partitionKey(partitionKey)
                .status(OutboxStatus.PENDING)
                .build());
    }
}
