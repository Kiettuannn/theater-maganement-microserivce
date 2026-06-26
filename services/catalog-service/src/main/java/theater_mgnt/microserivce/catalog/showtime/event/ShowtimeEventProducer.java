package theater_mgnt.microserivce.catalog.showtime.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.common.enums.DayType;
import theater_mgnt.microserivce.catalog.common.enums.TimeSlot;
import theater_mgnt.microserivce.catalog.priceConfig.entity.PriceConfig;
import theater_mgnt.microserivce.catalog.priceConfig.repository.PriceConfigRepository;
import theater_mgnt.microserivce.catalog.showtime.entity.Showtime;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;
import theater_mgnt.microserivce.catalog.seat.repository.SeatRepository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShowtimeEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SeatRepository seatRepository;
    private final PriceConfigRepository priceConfigRepository;

    public void publishShowtimeCreated(Showtime showtime) {
        List<Seat> seats = seatRepository.findByRoomIdWithSeatType(showtime.getRoom().getId());

        DayType dayType = DayType.from(showtime.getStartTime().toLocalDate());
        TimeSlot timeSlot = TimeSlot.from(showtime.getStartTime().toLocalTime());

        // Build price map: seatTypeId -> price (with fallback to basePriceModifier per spec §4.2)
        // NOTE: Collectors.toMap() does NOT allow null values (throws NPE).
        // Use HashMap with manual put() to support null (= no PriceConfig found → use basePriceModifier fallback).
        List<String> distinctSeatTypeIds = seats.stream()
                .map(s -> s.getSeatType().getId())
                .distinct()
                .collect(Collectors.toList());

        Map<String, BigDecimal> priceCache = new HashMap<>();
        for (String seatTypeId : distinctSeatTypeIds) {
            BigDecimal price = priceConfigRepository
                    .findBySeatTypeIdAndDayTypeAndTimeSlot(seatTypeId, dayType, timeSlot)
                    .map(PriceConfig::getPrice)
                    .orElse(null); // null → caller falls back to basePriceModifier
            priceCache.put(seatTypeId, price);
        }

        List<Map<String, Object>> seatEvents = seats.stream()
                .map(seat -> {
                    BigDecimal configPrice = priceCache.get(seat.getSeatType().getId());
                    // Fallback to basePriceModifier when no PriceConfig found
                    BigDecimal price = (configPrice != null)
                            ? configPrice
                            : seat.getSeatType().getBasePriceModifier();
                    // Field names MUST match ShowtimeCreatedEvent.SeatInfoEvent in Booking Service:
                    // seatId, rowLabel, seatNumber, seatType, price
                    return Map.<String, Object>of(
                            "seatId",     seat.getId(),
                            "rowLabel",   seat.getRowChair(),   // Booking SeatInfoEvent.rowLabel
                            "seatNumber", seat.getSeatNumber(),
                            "seatType",   seat.getSeatType().getTypeName(), // Booking SeatInfoEvent.seatType
                            "price",      price
                    );
                })
                .toList();

        // startTime/endTime as ISO-8601 string compatible with Instant.parse() in Booking Consumer
        // LocalDateTime.toString() = "2026-06-28T14:00" — Instant.parse() expects "2026-06-28T14:00:00Z"
        // Use toInstant(ZoneOffset.UTC) to produce a proper Instant string
        Map<String, Object> event = Map.of(
                "showtimeId", showtime.getId(),
                "roomId",     showtime.getRoom().getId(),
                "movieId",    showtime.getMovie().getId(),
                "movieTitle", showtime.getMovie().getTitle(),
                "startTime",  showtime.getStartTime().atZone(java.time.ZoneId.systemDefault()).toInstant().toString(),
                "endTime",    showtime.getEndTime().atZone(java.time.ZoneId.systemDefault()).toInstant().toString(),
                "seats",      seatEvents
        );

        // Note: Kafka topic name intentionally kept as-is (skipped per #2)
        kafkaTemplate.send("cinema.catalog.showtime-created", showtime.getId(), event);
        log.info("Published showtime-created for showtime {} with {} seats (dayType={}, timeSlot={})",
                showtime.getId(), seatEvents.size(), dayType, timeSlot);
    }

    public void publishShowtimeCancelled(Showtime showtime) {
        kafkaTemplate.send("cinema.catalog.showtime-cancelled", showtime.getId(),
                Map.of("showtimeId", showtime.getId(), "reason", "DELETED"));
        log.info("Published showtime-cancelled for showtime {}", showtime.getId());
    }
}
