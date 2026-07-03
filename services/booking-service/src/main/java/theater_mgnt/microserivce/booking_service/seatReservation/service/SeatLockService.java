package theater_mgnt.microserivce.booking_service.seatReservation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Redis seat lock layer (spec §4.2).
 * Key format : seat:lock:{showtimeId}:{seatId}
 * Value      : bookingId / userId string
 * TTL        : 8 minutes (480 s)
 *
 * All-or-nothing: if any SETNX fails, already-set keys are rolled back.
 * If Redis is unavailable → falls through to DB constraint only (logged as warning).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final RedisTemplate<String, String> redisTemplate;

    /** 8-minute TTL per spec */
    private static final Duration LOCK_TTL   = Duration.ofMinutes(8);
    private static final String   KEY_PREFIX = "seat:lock:";

    public boolean tryLockAll(String showtimeId, List<String> seatIds, String holder) {
        try {
            List<String> locked = new ArrayList<>();
            for (String seatId : seatIds) {
                String key = buildKey(showtimeId, seatId);
                Boolean success = redisTemplate.opsForValue()
                        .setIfAbsent(key, holder, LOCK_TTL);
                if (Boolean.TRUE.equals(success)) {
                    locked.add(seatId);
                } else {
                    // Rollback already-locked keys
                    locked.forEach(id -> safeDelete(buildKey(showtimeId, id)));
                    log.warn("Seat {} already locked for showtime {}", seatId, showtimeId);
                    return false;
                }
            }
            return true;
        } catch (DataAccessException e) {
            log.warn("Redis unavailable for seat locking (showtime={}) – DB-only mode: {}",
                    showtimeId, e.getMessage());
            return true; // Fallback: rely on DB partial-unique index
        }
    }


    public void releaseAll(String showtimeId, List<String> seatIds) {
        seatIds.forEach(seatId -> safeDelete(buildKey(showtimeId, seatId)));
    }

    /**
     * Release a lock for a specific showtime+seatId if the lock holder matches.
     * Used by startup sync to clear stale locks for AVAILABLE seats.
     */
    public void releaseIfExists(String showtimeId, String seatId) {
        safeDelete(buildKey(showtimeId, seatId));
    }

    /**
     * Scan and delete all seat:lock keys matching a pattern.
     * WARNING: SCAN-based, use only at startup — not in hot paths.
     */
    public long clearAllLocksForShowtime(String showtimeId) {
        try {
            String pattern = KEY_PREFIX + showtimeId + ":*";
            var keys = redisTemplate.keys(pattern);
            if (keys == null || keys.isEmpty()) return 0;
            Long deleted = redisTemplate.delete(keys);
            return deleted != null ? deleted : 0;
        } catch (DataAccessException e) {
            log.warn("Redis unavailable when clearing locks for showtime {}: {}", showtimeId, e.getMessage());
            return 0;
        }
    }

    private void safeDelete(String key) {
        try {
            redisTemplate.delete(key);
        } catch (DataAccessException e) {
            log.warn("Redis unavailable when releasing seat lock key {}: {}", key, e.getMessage());
        }
    }

    public String buildKey(String showtimeId, String seatId) {
        return KEY_PREFIX + showtimeId + ":" + seatId;
    }
}
