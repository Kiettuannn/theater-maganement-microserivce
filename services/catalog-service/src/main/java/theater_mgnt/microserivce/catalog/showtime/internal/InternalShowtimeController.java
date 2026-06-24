package theater_mgnt.microserivce.catalog.showtime.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.showtime.entity.Showtime;
import theater_mgnt.microserivce.catalog.showtime.internal.dto.ShowtimeValidationResponse;
import theater_mgnt.microserivce.catalog.showtime.repository.ShowtimeRepository;

@RestController
@RequestMapping("/internal/showtimes")
@RequiredArgsConstructor
public class InternalShowtimeController {

    private final ShowtimeRepository showtimeRepository;

    @Transactional(readOnly = true)
    @GetMapping("/{showtimeId}/validate")
    public ShowtimeValidationResponse validate(@PathVariable String showtimeId) {
        Showtime s = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));
        return ShowtimeValidationResponse.builder()
                .showtimeId(s.getId())
                .movieTitle(s.getMovie().getTitle())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .status(s.getStatus().name())
                .roomId(s.getRoom().getId())
                .build();
    }
}
