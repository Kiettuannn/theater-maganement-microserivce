package theater_mgnt.microserivce.booking_service.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShowtimeCreatedEvent {
    String showtimeId;
    String roomId;
    String movieTitle;
    String startTime;
    String endTime;
    List<SeatInfoEvent> seats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class SeatInfoEvent {
        String seatId;
        String rowLabel;
        Integer seatNumber;
        String seatType;
        BigDecimal price;
    }
}
