package theater_mgnt.microserivce.catalog.showtime.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;
import theater_mgnt.microserivce.catalog.movie.repository.MovieRepository;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.room.repository.RoomRepository;
import theater_mgnt.microserivce.catalog.showtime.dto.request.ShowtimeCreationRequest;
import theater_mgnt.microserivce.catalog.showtime.dto.request.ShowtimeUpdateRequest;
import theater_mgnt.microserivce.catalog.showtime.dto.response.ShowtimeDetailResponse;
import theater_mgnt.microserivce.catalog.showtime.dto.response.ShowtimeResponse;
import theater_mgnt.microserivce.catalog.showtime.entity.Showtime;
import theater_mgnt.microserivce.catalog.showtime.enums.ShowtimeStatus;
import theater_mgnt.microserivce.catalog.showtime.event.ShowtimeEventProducer;
import theater_mgnt.microserivce.catalog.showtime.mapper.ShowtimeMapper;
import theater_mgnt.microserivce.catalog.showtime.repository.ShowtimeRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShowtimeService {

    RoomRepository roomRepository;
    MovieRepository movieRepository;
    ShowtimeRepository showtimeRepository;
    ShowtimeMapper showtimeMapper;
    ShowtimeEventProducer showtimeEventProducer;

    private void validateShowtimeTime(LocalDateTime start, LocalDateTime end) {
        if (!start.isAfter(LocalDateTime.now())) throw new AppException(ErrorCode.SHOWTIME_TIME_INVALID);
        if (!end.isAfter(start)) throw new AppException(ErrorCode.SHOWTIME_TIME_INVALID);
    }

    private void validateOverlap(String roomId, LocalDateTime start, LocalDateTime end, String currentId) {
        if (showtimeRepository.isTimeOverlap(roomId, start, end, currentId)) {
            throw new AppException(ErrorCode.SHOWTIME_TIME_OVERLAP);
        }
    }

    @Transactional
    public ShowtimeResponse createShowtime(ShowtimeCreationRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        validateShowtimeTime(request.getStartTime(), request.getEndTime());
        validateOverlap(request.getRoomId(), request.getStartTime(), request.getEndTime(), null);

        Showtime showtime = showtimeMapper.toShowtime(request);
        showtime.setRoom(room);
        showtime.setMovie(movie);
        showtime.setStatus(ShowtimeStatus.SCHEDULED);
        Showtime saved = showtimeRepository.save(showtime);

        showtimeEventProducer.publishShowtimeCreated(saved);

        return showtimeMapper.toShowtimeResponse(saved);
    }

    public List<ShowtimeResponse> getShowtimesByRoomId(String roomId) {
        return showtimeRepository.findByRoomIdWithAssociations(roomId).stream()
                .map(showtimeMapper::toShowtimeResponse)
                .toList();
    }

    public List<ShowtimeResponse> getShowtimesByMovieId(String movieId) {
        return showtimeRepository.findByMovieIdWithAssociations(movieId).stream()
                .map(showtimeMapper::toShowtimeResponse)
                .toList();
    }

    public List<ShowtimeResponse> getShowtimes() {
        return showtimeRepository.findAllWithAssociations().stream()
                .map(showtimeMapper::toShowtimeResponse)
                .toList();
    }

    public ShowtimeResponse getShowtime(String showtimeId) {
        Showtime showtime = showtimeRepository.findByIdWithAssociations(showtimeId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));
        return showtimeMapper.toShowtimeResponse(showtime);
    }

    @Cacheable(value = "showtime", key = "#showtimeId")
    public ShowtimeDetailResponse getShowtimeDetail(String showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));
        return showtimeMapper.toShowtimeDetailResponse(showtime, showtime.getRoom().getTotalSeats());
    }

    @Transactional
    @CacheEvict(value = "showtime", key = "#showtimeId")
    public ShowtimeResponse updateShowtime(String showtimeId, ShowtimeUpdateRequest request) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));

        if (showtime.getStatus() != ShowtimeStatus.SCHEDULED)
            throw new AppException(ErrorCode.SHOWTIME_CANNOT_UPDATE);

        validateShowtimeTime(request.getStartTime(), request.getEndTime());
        validateOverlap(showtime.getRoom().getId(), request.getStartTime(), request.getEndTime(), showtimeId);

        showtimeMapper.updateShowtime(showtime, request);
        return showtimeMapper.toShowtimeResponse(showtimeRepository.save(showtime));
    }

    @Transactional
    @CacheEvict(value = "showtime", key = "#showtimeId")
    public void deleteShowtime(String showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));

        showtimeRepository.delete(showtime);
        showtimeEventProducer.publishShowtimeCancelled(showtime);
    }
}
