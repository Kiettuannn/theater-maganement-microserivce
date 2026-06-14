package theater_mgnt.microserivce.catalog.screening;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import theater_mgnt.microserivce.catalog.common.enums.DayType;
import theater_mgnt.microserivce.catalog.common.enums.TimeSlot;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;
import theater_mgnt.microserivce.catalog.movie.repository.MovieRepository;
import theater_mgnt.microserivce.catalog.priceConfig.entity.PriceConfig;
import theater_mgnt.microserivce.catalog.priceConfig.repository.PriceConfigRepository;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.room.repository.RoomRepository;
import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningCreationRequest;
import theater_mgnt.microserivce.catalog.screening.entity.Screening;
import theater_mgnt.microserivce.catalog.screening.enums.ScreeningStatus;
import theater_mgnt.microserivce.catalog.screening.event.ScreeningEventProducer;
import theater_mgnt.microserivce.catalog.screening.mapper.ScreeningMapper;
import theater_mgnt.microserivce.catalog.screening.repository.ScreeningRepository;
import theater_mgnt.microserivce.catalog.screening.service.ScreeningService;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;
import theater_mgnt.microserivce.catalog.seat.repository.SeatRepository;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScreeningService – tạo/xóa suất chiếu và validate PriceConfig")
class ScreeningServiceTest {

    @Mock RoomRepository roomRepository;
    @Mock MovieRepository movieRepository;
    @Mock ScreeningRepository screeningRepository;
    @Mock ScreeningMapper screeningMapper;
    @Mock ScreeningEventProducer screeningEventProducer;
    @Mock KafkaTemplate<String, Object> kafkaTemplate;
    @Mock SeatRepository seatRepository;
    @Mock PriceConfigRepository priceConfigRepository;

    ScreeningService screeningService;

    // Screening sẽ lúc 18:00 thứ Tư → WEEKDAY + EVENING
    private static final LocalDateTime START = LocalDateTime.of(2026, 12, 16, 18, 0);
    private static final LocalDateTime END   = LocalDateTime.of(2026, 12, 16, 21, 1);

    private Room room;
    private Movie movie;
    private SeatType stdType;
    private Seat seatA1;

    @BeforeEach
    void setUp() {
        // Inject qua constructor (RequiredArgsConstructor + makeFinal)
        screeningService = new ScreeningService(
                roomRepository, movieRepository, screeningRepository,
                screeningMapper, screeningEventProducer, kafkaTemplate,
                seatRepository, priceConfigRepository
        );

        room = new Room();
        room.setId("room-1");
        room.setName("Phòng 1");
        room.setTotalSeats(2);

        movie = new Movie();
        movie.setId("movie-1");
        movie.setTitle("Avengers: Endgame");

        stdType = new SeatType();
        stdType.setId("type-std");
        stdType.setTypeName("Standard");

        seatA1 = new Seat();
        seatA1.setId("seat-A1");
        seatA1.setRowChair("A");
        seatA1.setSeatNumber(1);
        seatA1.setSeatType(stdType);
        seatA1.setRoom(room);
    }

    // =========================================================
    // CREATE SCREENING – HAPPY PATH
    // =========================================================

    @Test
    @DisplayName("Tạo screening thành công: PriceConfig đủ → publish Kafka event")
    void createScreening_success_publishesKafkaEvent() {
        ScreeningCreationRequest req = new ScreeningCreationRequest();
        req.setRoomId("room-1");
        req.setMovieId("movie-1");
        req.setStartTime(START);
        req.setEndTime(END);

        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(movieRepository.findById("movie-1")).thenReturn(Optional.of(movie));
        when(screeningRepository.isTimeOverlap("room-1", START, END, null)).thenReturn(false);
        when(seatRepository.findByRoomIdWithSeatType("room-1")).thenReturn(List.of(seatA1));

        PriceConfig priceConfig = new PriceConfig();
        priceConfig.setPrice(BigDecimal.valueOf(75000));
        when(priceConfigRepository.findBySeatTypeIdAndDayTypeAndTimeSlot("type-std", DayType.WEEKDAY, TimeSlot.EVENING))
                .thenReturn(Optional.of(priceConfig));

        Screening screening = new Screening();
        screening.setId("screening-1");
        screening.setRoom(room);
        screening.setMovie(movie);
        screening.setStatus(ScreeningStatus.SCHEDULED);
        screening.setStartTime(START);
        screening.setEndTime(END);

        when(screeningMapper.toScreening(req)).thenReturn(screening);
        when(screeningRepository.save(screening)).thenReturn(screening);
        when(screeningMapper.toScreeningResponse(screening)).thenReturn(null);

        screeningService.createScreening(req);

        verify(screeningRepository).save(screening);
        verify(screeningEventProducer).publishScreeningCreated(screening);
    }

    @Test
    @DisplayName("Tạo screening: phòng không tồn tại → ROOM_NOT_EXISTED")
    void createScreening_roomNotFound_throwsError() {
        ScreeningCreationRequest req = new ScreeningCreationRequest();
        req.setRoomId("invalid-room");
        req.setMovieId("movie-1");
        req.setStartTime(START);
        req.setEndTime(END);

        when(roomRepository.findById("invalid-room")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> screeningService.createScreening(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.ROOM_NOT_EXISTED));
    }

    @Test
    @DisplayName("Tạo screening: phim không tồn tại → MOVIE_NOT_EXISTED")
    void createScreening_movieNotFound_throwsError() {
        ScreeningCreationRequest req = new ScreeningCreationRequest();
        req.setRoomId("room-1");
        req.setMovieId("invalid-movie");
        req.setStartTime(START);
        req.setEndTime(END);

        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(movieRepository.findById("invalid-movie")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> screeningService.createScreening(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.MOVIE_NOT_EXISTED));
    }

    @Test
    @DisplayName("Tạo screening: thời gian trong quá khứ → SCREENING_TIME_INVALID")
    void createScreening_pastTime_throwsError() {
        ScreeningCreationRequest req = new ScreeningCreationRequest();
        req.setRoomId("room-1");
        req.setMovieId("movie-1");
        req.setStartTime(LocalDateTime.now().minusDays(1));
        req.setEndTime(LocalDateTime.now().minusDays(1).plusHours(2));

        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(movieRepository.findById("movie-1")).thenReturn(Optional.of(movie));

        assertThatThrownBy(() -> screeningService.createScreening(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCREENING_TIME_INVALID));
    }

    @Test
    @DisplayName("Tạo screening: trùng giờ với screening khác → SCREENING_TIME_OVERLAP")
    void createScreening_timeOverlap_throwsError() {
        ScreeningCreationRequest req = new ScreeningCreationRequest();
        req.setRoomId("room-1");
        req.setMovieId("movie-1");
        req.setStartTime(START);
        req.setEndTime(END);

        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(movieRepository.findById("movie-1")).thenReturn(Optional.of(movie));
        when(screeningRepository.isTimeOverlap("room-1", START, END, null)).thenReturn(true);

        assertThatThrownBy(() -> screeningService.createScreening(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCREENING_TIME_OVERLAP));
    }

    @Test
    @DisplayName("Tạo screening: thiếu PriceConfig → PRICECONFIG_NOT_EXISTED")
    void createScreening_missingPriceConfig_throwsError() {
        ScreeningCreationRequest req = new ScreeningCreationRequest();
        req.setRoomId("room-1");
        req.setMovieId("movie-1");
        req.setStartTime(START);
        req.setEndTime(END);

        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(movieRepository.findById("movie-1")).thenReturn(Optional.of(movie));
        when(screeningRepository.isTimeOverlap("room-1", START, END, null)).thenReturn(false);
        when(seatRepository.findByRoomIdWithSeatType("room-1")).thenReturn(List.of(seatA1));
        when(priceConfigRepository.findBySeatTypeIdAndDayTypeAndTimeSlot("type-std", DayType.WEEKDAY, TimeSlot.EVENING))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> screeningService.createScreening(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.PRICECONFIG_NOT_EXISTED));
    }

    // =========================================================
    // DELETE SCREENING – Kafka cascade
    // =========================================================

    @Test
    @DisplayName("Xóa screening thành công → publish kafka screening.cancelled")
    void deleteScreening_success_publishesKafkaEvent() {
        Screening screening = new Screening();
        screening.setId("screening-1");

        when(screeningRepository.findById("screening-1")).thenReturn(Optional.of(screening));

        screeningService.deleteScreening("screening-1");

        verify(screeningRepository).delete(screening);
        verify(kafkaTemplate).send(eq("catalog.screening.cancelled"), eq("screening-1"), any());
    }

    @Test
    @DisplayName("Xóa screening không tồn tại → SCREENING_NOT_EXISTED")
    void deleteScreening_notFound_throwsError() {
        when(screeningRepository.findById("invalid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> screeningService.deleteScreening("invalid"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCREENING_NOT_EXISTED));
    }
}
