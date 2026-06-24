package theater_mgnt.microserivce.catalog.screening.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import theater_mgnt.microserivce.catalog.common.enums.DayType;
import theater_mgnt.microserivce.catalog.common.enums.TimeSlot;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;
import theater_mgnt.microserivce.catalog.movie.repository.MovieRepository;
import theater_mgnt.microserivce.catalog.priceConfig.repository.PriceConfigRepository;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.room.repository.RoomRepository;
import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningCreationRequest;
import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningUpdateRequest;
import theater_mgnt.microserivce.catalog.screening.dto.response.ScreeningDetailResponse;
import theater_mgnt.microserivce.catalog.screening.dto.response.ScreeningResponse;
import theater_mgnt.microserivce.catalog.screening.entity.Screening;
import theater_mgnt.microserivce.catalog.screening.enums.ScreeningStatus;
import theater_mgnt.microserivce.catalog.screening.event.ScreeningEventProducer;
import theater_mgnt.microserivce.catalog.screening.mapper.ScreeningMapper;
import theater_mgnt.microserivce.catalog.screening.repository.ScreeningRepository;
import theater_mgnt.microserivce.catalog.seat.repository.SeatRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScreeningService {

    RoomRepository roomRepository;
    MovieRepository movieRepository;
    ScreeningRepository screeningRepository;
    ScreeningMapper screeningMapper;
    ScreeningEventProducer screeningEventProducer;
    KafkaTemplate<String, Object> kafkaTemplate;
    SeatRepository seatRepository;
    PriceConfigRepository priceConfigRepository;

    private void validateScreeningTime(LocalDateTime start, LocalDateTime end) {
        if (!start.isAfter(LocalDateTime.now())) throw new AppException(ErrorCode.SCREENING_TIME_INVALID);
        if (!end.isAfter(start)) throw new AppException(ErrorCode.SCREENING_TIME_INVALID);
    }

    private void validateOverlap(String roomId, LocalDateTime start, LocalDateTime end, String currentId) {
        if (screeningRepository.isTimeOverlap(roomId, start, end, currentId)) {
            throw new AppException(ErrorCode.SCREENING_TIME_OVERLAP);
        }
    }

    /**
     * Validate rằng tất cả seatType trong phòng đã có PriceConfig cho dayType + timeSlot tương ứng.
     * Nếu thiếu → báo lỗi trước khi tạo screening để tránh SeatReservation có price = 0.
     */
    private void validatePriceConfigExists(String roomId, DayType dayType, TimeSlot timeSlot) {
        Set<String> seatTypeIds = seatRepository.findByRoomIdWithSeatType(roomId).stream()
                .map(seat -> seat.getSeatType().getId())
                .collect(Collectors.toSet());

        List<String> missing = seatTypeIds.stream()
                .filter(id -> priceConfigRepository.findBySeatTypeIdAndDayTypeAndTimeSlot(id, dayType, timeSlot).isEmpty())
                .toList();

        if (!missing.isEmpty()) {
            log.warn("Missing PriceConfig for seatTypeIds={} dayType={} timeSlot={}", missing, dayType, timeSlot);
            throw new AppException(ErrorCode.PRICECONFIG_NOT_EXISTED);
        }
    }

    @Transactional
    public ScreeningResponse createScreening(ScreeningCreationRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        validateScreeningTime(request.getStartTime(), request.getEndTime());
        validateOverlap(request.getRoomId(), request.getStartTime(), request.getEndTime(), null);

        DayType dayType = DayType.from(request.getStartTime().toLocalDate());
        TimeSlot timeSlot = TimeSlot.from(request.getStartTime().toLocalTime());
        validatePriceConfigExists(request.getRoomId(), dayType, timeSlot);

        Screening screening = screeningMapper.toScreening(request);
        screening.setRoom(room);
        screening.setMovie(movie);
        screening.setStatus(ScreeningStatus.SCHEDULED);
        Screening saved = screeningRepository.save(screening);

        screeningEventProducer.publishScreeningCreated(saved);

        return screeningMapper.toScreeningResponse(saved);
    }

    public List<ScreeningResponse> getScreeningsByRoomId(String roomId) {
        return screeningRepository.findByRoomId(roomId).stream()
                .map(screeningMapper::toScreeningResponse)
                .toList();
    }

    public List<ScreeningResponse> getScreeningsByMovieId(String movieId) {
        return screeningRepository.findByMovieId(movieId).stream()
                .map(screeningMapper::toScreeningResponse)
                .toList();
    }

    public List<ScreeningResponse> getScreenings() {
        return screeningRepository.findAll().stream()
                .map(screeningMapper::toScreeningResponse)
                .toList();
    }

    public ScreeningResponse getScreening(String screeningId) {
        Screening screening = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_NOT_EXISTED));
        return screeningMapper.toScreeningResponse(screening);
    }

    @Cacheable(value = "showtime", key = "#screeningId")
    public ScreeningDetailResponse getScreeningDetail(String screeningId) {
        Screening screening = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_NOT_EXISTED));
        return screeningMapper.toScreeningDetailResponse(screening, screening.getRoom().getTotalSeats());
    }

    @Transactional
    @CacheEvict(value = "showtime", key = "#screeningId")
    public ScreeningResponse updateScreening(String screeningId, ScreeningUpdateRequest request) {
        Screening screening = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_NOT_EXISTED));

        if (screening.getStatus() != ScreeningStatus.SCHEDULED)
            throw new AppException(ErrorCode.SCREENING_CANNOT_UPDATE);

        validateScreeningTime(request.getStartTime(), request.getEndTime());
        validateOverlap(screening.getRoom().getId(), request.getStartTime(), request.getEndTime(), screeningId);

        screeningMapper.updateScreening(screening, request);
        return screeningMapper.toScreeningResponse(screeningRepository.save(screening));
    }

    @Transactional
    @CacheEvict(value = "showtime", key = "#screeningId")
    public void deleteScreening(String screeningId) {
        Screening screening = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_NOT_EXISTED));

        screeningRepository.delete(screening);

        kafkaTemplate.send("catalog.screening.cancelled", screeningId,
                java.util.Map.of("screeningId", screeningId, "reason", "DELETED"));
    }
}
