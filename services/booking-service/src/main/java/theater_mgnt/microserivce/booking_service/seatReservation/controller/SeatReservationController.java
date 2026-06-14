package theater_mgnt.microserivce.booking_service.seatReservation.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.booking_service.seatReservation.dto.SeatStatusResponse;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;

import java.util.List;

@RestController
@RequestMapping("/screenings")
@RequiredArgsConstructor
public class SeatReservationController {

    private final SeatReservationRepository seatReservationRepository;

    @GetMapping("/{screeningId}/seat-map")
    public ApiResponse<List<SeatStatusResponse>> getSeatMap(@PathVariable String screeningId) {
        List<SeatReservation> reservations = seatReservationRepository.findByShowtimeId(screeningId);
        List<SeatStatusResponse> result = reservations.stream()
                .map(s -> SeatStatusResponse.builder()
                        .seatId(s.getSeatId())
                        .rowChair(s.getRowChair())
                        .seatNumber(s.getSeatNumber())
                        .seatName(s.getRowChair() + s.getSeatNumber())
                        .seatTypeName(s.getSeatTypeName())
                        .price(s.getPrice())
                        .status(s.getStatus())
                        .build())
                .toList();
        return ApiResponse.<List<SeatStatusResponse>>builder().result(result).build();
    }
}
