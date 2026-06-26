package theater_mgnt.microserivce.catalog.room.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import theater_mgnt.microserivce.catalog.common.enums.RoomType;
import theater_mgnt.microserivce.catalog.room.enums.RoomStatus;
import theater_mgnt.microserivce.catalog.seat.dto.request.SeatRequest;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomCreationRequest {

    @Size(min = 3, message = "ROOM_NAME_INVALID")
    String name;

    @NotNull
    RoomType roomType;

    RoomStatus status;

    List<SeatRequest> seats;
}

