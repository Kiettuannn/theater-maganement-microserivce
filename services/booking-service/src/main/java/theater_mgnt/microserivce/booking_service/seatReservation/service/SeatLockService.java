package theater_mgnt.microserivce.booking_service.seatReservation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${seat.lock.ttl-minutes:10}")
    private int ttlMinutes;

    private static final String KEY_PREFIX = "seat:lock:";

    /**
     * Atomic lock tất cả seat IDs. Nếu bất kỳ seat nào thất bại → rollback tất cả.
     * Nếu Redis down → log warning và trả về true (fallback: chỉ dùng DB constraint).
     * @return true nếu tất cả seats đã lock thành công, false nếu có seat đã bị lock
     */
    public boolean tryLockAll(String screeningId, List<String> seatIds, String bookingId) {
        try {
            List<String> locked = new ArrayList<>();
            for (String seatId : seatIds) {
                String key = buildKey(screeningId, seatId);
                Boolean success = redisTemplate.opsForValue()
                        .setIfAbsent(key, bookingId, Duration.ofMinutes(ttlMinutes));
                if (Boolean.TRUE.equals(success)) {
                    locked.add(seatId);
                } else {
                    locked.forEach(id -> safeDelete(buildKey(screeningId, id)));
                    log.warn("Seat {} already locked in Redis for screening {}", seatId, screeningId);
                    return false;
                }
            }
            return true;
        } catch (DataAccessException e) {
            log.warn("Redis unavailable for seat locking (screening={}) – falling back to DB-only mode: {}",
                    screeningId, e.getMessage());
            return true;
        }
    }

    public void releaseAll(String screeningId, List<String> seatIds) {
        seatIds.forEach(seatId -> safeDelete(buildKey(screeningId, seatId)));
    }

    private void safeDelete(String key) {
        try {
            redisTemplate.delete(key);
        } catch (DataAccessException e) {
            log.warn("Redis unavailable when releasing seat lock key {}: {}", key, e.getMessage());
        }
    }

    private String buildKey(String screeningId, String seatId) {
        return KEY_PREFIX + screeningId + ":" + seatId;
    }
}
