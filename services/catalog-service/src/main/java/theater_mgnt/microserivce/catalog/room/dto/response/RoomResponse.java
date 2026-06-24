package theater_mgnt.microserivce.catalog.room.dto.response;

import java.util.List;

import theater_mgnt.microserivce.catalog.seat.dto.response.SeatResponse;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomResponse {
    String id;
    String name;
    String roomType;
    String status;
    Integer totalSeats;
    List<SeatResponse> seats;
}

