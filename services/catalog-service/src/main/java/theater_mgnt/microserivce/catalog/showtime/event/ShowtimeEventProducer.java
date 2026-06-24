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
        Map<String, BigDecimal> priceCache = seats.stream()
                .map(s -> s.getSeatType().getId())
                .distinct()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> priceConfigRepository
                                .findBySeatTypeIdAndDayTypeAndTimeSlot(id, dayType, timeSlot)
                                .map(PriceConfig::getPrice)
                                .orElse(null) // null means we use basePriceModifier fallback below
                ));

        List<Map<String, Object>> seatEvents = seats.stream()
                .map(seat -> {
                    BigDecimal configPrice = priceCache.get(seat.getSeatType().getId());
                    // Fix #5: fallback to basePriceModifier, not ZERO
                    BigDecimal price = (configPrice != null)
                            ? configPrice
                            : seat.getSeatType().getBasePriceModifier();
                    return Map.<String, Object>of(
                            "seatId",       seat.getId(),
                            "seatName",     seat.getRowChair() + seat.getSeatNumber(),
                            "seatTypeId",   seat.getSeatType().getId(),
                            "seatTypeName", seat.getSeatType().getTypeName(),
                            "price",        price
                    );
                })
                .toList();

        Map<String, Object> event = Map.of(
                "showtimeId", showtime.getId(),
                "roomId",     showtime.getRoom().getId(),
                "movieId",    showtime.getMovie().getId(),
                "movieTitle", showtime.getMovie().getTitle(),
                "startTime",  showtime.getStartTime().toString(),
                "endTime",    showtime.getEndTime().toString(),
                "dayType",    dayType.name(),
                "timeSlot",   timeSlot.name(),
                "seats",      seatEvents
        );

        // Note: Kafka topic name intentionally kept as-is (skipped per #2)
        kafkaTemplate.send("catalog.screening.created", showtime.getId(), event);
        log.info("Published screening.created for showtime {} with {} seats (dayType={}, timeSlot={})",
                showtime.getId(), seatEvents.size(), dayType, timeSlot);
    }

    public void publishShowtimeCancelled(Showtime showtime) {
        // Note: Kafka topic name intentionally kept as-is (skipped per #4)
        kafkaTemplate.send("catalog.screening.cancelled", showtime.getId(),
                Map.of("screeningId", showtime.getId(), "reason", "DELETED"));
        log.info("Published screening.cancelled for showtime {}", showtime.getId());
    }
}
