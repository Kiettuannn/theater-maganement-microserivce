package theater_mgnt.microserivce.catalog.room.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.room.dto.request.RoomCreationRequest;
import theater_mgnt.microserivce.catalog.room.dto.request.RoomUpdateRequest;
import theater_mgnt.microserivce.catalog.room.dto.response.RoomResponse;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.room.mapper.RoomMapper;
import theater_mgnt.microserivce.catalog.room.repository.RoomRepository;
import theater_mgnt.microserivce.catalog.showtime.enums.ShowtimeStatus;
import theater_mgnt.microserivce.catalog.showtime.repository.ShowtimeRepository;
import theater_mgnt.microserivce.catalog.seat.service.SeatService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoomService {
    RoomRepository roomRepository;
    ShowtimeRepository showtimeRepository;
    RoomMapper roomMapper;
    SeatService seatService;

    /**
     * Kiểm tra phòng có suất chiếu SCHEDULED trong tương lai không.
     * Nếu có → không cho phép thay đổi cấu hình phòng/ghế.
     */
    private void validateRoomNotBusy(String roomId) {
        boolean isBusy = showtimeRepository.existsByRoomIdAndStatusAndStartTimeAfter(
                roomId, ShowtimeStatus.SCHEDULED, LocalDateTime.now());
        if (isBusy) throw new AppException(ErrorCode.ROOM_HAS_SCHEDULED_SHOWTIMES);
    }

    @Transactional
    public RoomResponse createRoom(RoomCreationRequest request) {

        if (roomRepository.existsByName(request.getName()))
            throw new AppException(ErrorCode.ROOM_EXISTED);

        // Create room and save room
        Room room = roomMapper.toRoom(request);
        Room savedRoom = roomRepository.save(room);

        if (request.getSeats() != null) {
            seatService.syncSeats(room, request.getSeats());
        }

        return roomMapper.toRoomResponseWithSeats(savedRoom);
    }

    @Transactional
    public RoomResponse updateRoom(String roomId, RoomUpdateRequest request) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));

        // Không cho cập nhật phòng nếu đang có suất chiếu SCHEDULED trong tương lai
        // (vì thay đổi ghế/loại phòng sẽ ảnh hưởng đến booking đã có)
        if (request.getSeats() != null) {
            validateRoomNotBusy(roomId);
        }

        // Validate tên không trùng với phòng khác
        if (request.getName() != null
                && roomRepository.existsByNameAndIdNot(request.getName(), roomId)) {
            throw new AppException(ErrorCode.ROOM_EXISTED);
        }

        // Update room fields
        roomMapper.updateRoom(room, request);

        if (request.getSeats() != null) {
            seatService.syncSeats(room, request.getSeats());
        }

        Room savedRoom = roomRepository.save(room);
        return roomMapper.toRoomResponseWithSeats(savedRoom);
    }

    public List<RoomResponse> getRooms() {
        return roomRepository.findAll().stream().map(roomMapper::toRoomResponse).toList();
    }

    public RoomResponse getRoom(String roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));
        return roomMapper.toRoomResponseWithSeats(room);
    }

    @Transactional
    public void deleteRoom(String roomId) {
        if (!roomRepository.existsById(roomId)) throw new AppException(ErrorCode.ROOM_NOT_EXISTED);

        // Không cho xóa phòng nếu còn suất chiếu SCHEDULED trong tương lai
        validateRoomNotBusy(roomId);

        roomRepository.deleteById(roomId);
    }
}

