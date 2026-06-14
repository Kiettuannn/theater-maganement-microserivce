package theater_mgnt.microserivce.catalog.seat.service;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.seat.dto.request.SeatRequest;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;
import theater_mgnt.microserivce.catalog.seat.mapper.SeatMapper;
import theater_mgnt.microserivce.catalog.seat.repository.SeatRepository;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;
import theater_mgnt.microserivce.catalog.seatType.repository.SeatTypeRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatService {
    SeatRepository seatRepository;
    SeatTypeRepository seatTypeRepository;
    SeatMapper seatMapper;

    public void syncSeats(Room room, List<SeatRequest> seatRequests) {
        if (seatRequests == null || seatRequests.isEmpty()) {
            seatRequests = new ArrayList<>();
        }

        // Get all seats existing in the room
        List<Seat> currentSeats = seatRepository.findByRoomId(room.getId());

        Map<String, SeatRequest> requestMap = seatRequests.stream()
                .filter(req -> req.getId() != null)
                .collect(Collectors.toMap(SeatRequest::getId, Function.identity()));

        Set<String> keepSeatIds = requestMap.keySet();

        // Delete seats that are not in the new request
        List<Seat> seatsToDelete = currentSeats.stream()
                .filter(seat -> !keepSeatIds.contains(seat.getId()))
                .collect(Collectors.toList());
        if (!seatsToDelete.isEmpty()) {
            seatRepository.deleteAll(seatsToDelete);
        }

        Map<String, Seat> currentSeatMap =
                currentSeats.stream().collect(Collectors.toMap(Seat::getId, Function.identity()));

        Set<String> seatTypeIds =
                seatRequests.stream().map(SeatRequest::getSeatTypeId).collect(Collectors.toSet());

        Map<String, SeatType> seatTypeMap = seatTypeRepository.findAllById(seatTypeIds).stream()
                .collect(Collectors.toMap(SeatType::getId, Function.identity()));

        // Update existing seats and create new seats
        List<Seat> seatsToSave = seatRequests.stream()
                .map(req -> mapRequestToSeat(req, room, seatTypeMap, currentSeatMap))
                .collect(Collectors.toList());

        List<Seat> savedSeats = seatRepository.saveAll(seatsToSave);
        room.setSeats(savedSeats);
        room.setTotalSeats((int) seatRepository.countByRoomId(room.getId()));
    }

    private Seat mapRequestToSeat(
            SeatRequest seatRequest, Room room, Map<String, SeatType> seatTypeMap, Map<String, Seat> currentSeatMap) {

        SeatType seatType = seatTypeMap.get(seatRequest.getSeatTypeId());
        if (seatType == null) {
            throw new AppException(ErrorCode.SEATTYPE_NOT_EXISTED);
        }

        Seat seat;

        if (seatRequest.getId() != null && currentSeatMap.containsKey(seatRequest.getId())) {
            seat = currentSeatMap.get(seatRequest.getId());
        } else {
            seat = new Seat();
            seat.setRoom(room);
        }
        seatMapper.updateSeat(seat, seatRequest);
        seat.setSeatType(seatType);
        return seat;
    }
}
