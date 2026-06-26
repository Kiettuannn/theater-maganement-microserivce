package theater_mgnt.microserivce.booking_service.idempotency.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.booking_service.idempotency.entity.BookingIdempotencyKey;
import theater_mgnt.microserivce.booking_service.idempotency.repository.BookingIdempotencyKeyRepository;

import java.util.Optional;

/**
 * Admin/debug endpoint to inspect idempotency records.
 * Access should be restricted to ADMIN role.
 */
@RestController
@RequestMapping("/admin/idempotency")
@RequiredArgsConstructor
public class IdempotencyController {

    private final BookingIdempotencyKeyRepository repository;

    /** GET /admin/idempotency/{key} — look up an idempotency record by key */
    @GetMapping("/{key}")
    public ApiResponse<BookingIdempotencyKey> getByKey(@PathVariable String key) {
        Optional<BookingIdempotencyKey> record = repository.findById(key);
        return ApiResponse.<BookingIdempotencyKey>builder()
                .result(record.orElse(null))
                .build();
    }
}
