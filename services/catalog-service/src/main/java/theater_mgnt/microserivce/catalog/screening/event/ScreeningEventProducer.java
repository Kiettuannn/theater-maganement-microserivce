package theater_mgnt.microserivce.catalog.screening.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.common.enums.DayType;
import theater_mgnt.microserivce.catalog.common.enums.TimeSlot;
import theater_mgnt.microserivce.catalog.priceConfig.entity.PriceConfig;
import theater_mgnt.microserivce.catalog.priceConfig.repository.PriceConfigRepository;
import theater_mgnt.microserivce.catalog.screening.entity.Screening;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;
import theater_mgnt.microserivce.catalog.seat.repository.SeatRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScreeningEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SeatRepository seatRepository;
    private final PriceConfigRepository priceConfigRepository;

    public void publishScreeningCreated(Screening screening) {
        List<Seat> seats = seatRepository.findByRoomIdWithSeatType(screening.getRoom().getId());

        DayType dayType = DayType.from(screening.getStartTime().toLocalDate());
        TimeSlot timeSlot = TimeSlot.from(screening.getStartTime().toLocalTime());

        // Cache price per seatTypeId to avoid N+1
        Map<String, BigDecimal> priceCache = seats.stream()
                .map(s -> s.getSeatType().getId())
                .distinct()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> priceConfigRepository
                                .findBySeatTypeIdAndDayTypeAndTimeSlot(id, dayType, timeSlot)
                                .map(PriceConfig::getPrice)
                                .orElse(BigDecimal.ZERO)
                ));

        List<Map<String, Object>> seatEvents = seats.stream()
                .map(seat -> Map.<String, Object>of(
                        "seatId", seat.getId(),
                        "rowChair", seat.getRowChair(),
                        "seatNumber", seat.getSeatNumber(),
                        "seatTypeId", seat.getSeatType().getId(),
                        "seatTypeName", seat.getSeatType().getTypeName(),
                        "price", priceCache.getOrDefault(seat.getSeatType().getId(), BigDecimal.ZERO)
                ))
                .toList();

        Map<String, Object> event = Map.of(
                "screeningId", screening.getId(),
                "roomId", screening.getRoom().getId(),
                "movieTitle", screening.getMovie().getTitle(),
                "startTime", screening.getStartTime().toString(),
                "endTime", screening.getEndTime().toString(),
                "dayType", dayType.name(),
                "timeSlot", timeSlot.name(),
                "seats", seatEvents
        );

        kafkaTemplate.send("catalog.screening.created", screening.getId(), event);
        log.info("Published screening.created for screening {} with {} seats (dayType={}, timeSlot={})",
                screening.getId(), seatEvents.size(), dayType, timeSlot);
    }
}
