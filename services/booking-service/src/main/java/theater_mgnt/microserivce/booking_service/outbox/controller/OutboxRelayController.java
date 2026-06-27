package theater_mgnt.microserivce.booking_service.outbox.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.booking_service.outbox.dto.OutboxRecordResponse;
import theater_mgnt.microserivce.booking_service.outbox.entity.BookingOutbox;
import theater_mgnt.microserivce.booking_service.outbox.enums.OutboxStatus;
import theater_mgnt.microserivce.booking_service.outbox.repository.BookingOutboxRepository;
import theater_mgnt.microserivce.booking_service.outbox.service.OutboxRelayService;

import java.util.List;

/**
 * Admin endpoint for monitoring and manually triggering the outbox relay.
 * Access should be restricted to ADMIN role in security config.
 */
@RestController
@RequestMapping("/admin/outbox")
@RequiredArgsConstructor
public class OutboxRelayController {

    private final BookingOutboxRepository outboxRepository;
    private final OutboxRelayService outboxRelayService;

    /** GET /admin/outbox/pending — list all PENDING outbox records */
    @GetMapping("/pending")
    public ApiResponse<List<OutboxRecordResponse>> getPending() {
        List<OutboxRecordResponse> records = outboxRepository
                .findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
        return ApiResponse.<List<OutboxRecordResponse>>builder().result(records).build();
    }

    /** POST /admin/outbox/relay — manually trigger relay (admin use only) */
    @PostMapping("/relay")
    public ApiResponse<String> triggerRelay() {
        outboxRelayService.relayPendingEvents();
        return ApiResponse.<String>builder().result("Outbox relay triggered").build();
    }

    private OutboxRecordResponse toResponse(BookingOutbox o) {
        return OutboxRecordResponse.builder()
                .id(o.getId())
                .aggregateType(o.getAggregateType())
                .aggregateId(o.getAggregateId())
                .eventType(o.getEventType())
                .kafkaTopic(o.getKafkaTopic())
                .partitionKey(o.getPartitionKey())
                .status(o.getStatus())
                .attemptCount(o.getAttemptCount())
                .publishedAt(o.getPublishedAt())
                .createdAt(o.getCreatedAt())
                .build();
    }
}
