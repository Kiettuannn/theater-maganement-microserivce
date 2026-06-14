package theater_mgnt.microserivce.catalog.screening.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.screening.entity.Screening;
import theater_mgnt.microserivce.catalog.screening.internal.dto.ScreeningValidationResponse;
import theater_mgnt.microserivce.catalog.screening.repository.ScreeningRepository;

@RestController
@RequestMapping("/internal/screenings")
@RequiredArgsConstructor
public class InternalScreeningController {

    private final ScreeningRepository screeningRepository;

    @Transactional(readOnly = true)
    @GetMapping("/{screeningId}/validate")
    public ScreeningValidationResponse validate(@PathVariable String screeningId) {
        Screening s = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_NOT_EXISTED));
        return ScreeningValidationResponse.builder()
                .showtimeId(s.getId())
                .movieTitle(s.getMovie().getTitle())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .status(s.getStatus().name())
                .roomId(s.getRoom().getId())
                .build();
    }
}
