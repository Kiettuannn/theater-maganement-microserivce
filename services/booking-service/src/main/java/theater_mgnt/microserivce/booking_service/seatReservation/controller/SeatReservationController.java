package theater_mgnt.microserivce.booking_service.seatReservation.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.booking_service.seatReservation.dto.SeatStatusResponse;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/seat-reservations")
@RequiredArgsConstructor
public class SeatReservationController {

    private final SeatReservationRepository seatReservationRepository;

    /**
     * GET /seat-reservations
     * Returns all seat reservations with optional filters.
     *
     * @param showtimeId optional — filter by showtime
     * @param status     optional — filter by status (AVAILABLE, LOCKED, CONFIRMED, CANCELLED)
     */
    @GetMapping
    public ApiResponse<List<SeatStatusResponse>> getAllSeatReservations(
            @RequestParam(required = false) String showtimeId,
            @RequestParam(required = false) SeatReservationStatus status) {

        List<SeatReservation> reservations;

        if (showtimeId != null && status != null) {
            reservations = seatReservationRepository.findByShowtimeIdAndStatus(showtimeId, status);
        } else if (showtimeId != null) {
            reservations = seatReservationRepository.findByShowtimeId(showtimeId);
        } else if (status != null) {
            reservations = seatReservationRepository.findAll().stream()
                    .filter(s -> s.getStatus() == status)
                    .collect(Collectors.toList());
        } else {
            reservations = seatReservationRepository.findAll();
        }

        List<SeatStatusResponse> result = reservations.stream()
                .map(s -> SeatStatusResponse.builder()
                        .seatReservationId(s.getId())
                        .seatId(s.getSeatId())
                        .rowLabel(s.getRowLabel())
                        .seatNumber(s.getSeatNumber())
                        .seatName(s.getRowLabel() + s.getSeatNumber())
                        .seatType(s.getSeatType())
                        .price(s.getPrice())
                        .status(s.getStatus())
                        .build())
                .toList();

        return ApiResponse.<List<SeatStatusResponse>>builder().result(result).build();
    }

    /**
     * GET /seat-reservations/{showtimeId}
     * Returns full seat map (all status) for a showtime — used by booking UI.
     */
    @GetMapping("/{showtimeId}")
    public ApiResponse<List<SeatStatusResponse>> getSeatMap(@PathVariable String showtimeId) {
        List<SeatReservation> reservations = seatReservationRepository.findByShowtimeId(showtimeId);
        List<SeatStatusResponse> result = reservations.stream()
                .map(s -> SeatStatusResponse.builder()
                        .seatReservationId(s.getId())
                        .seatId(s.getSeatId())
                        .rowLabel(s.getRowLabel())
                        .seatNumber(s.getSeatNumber())
                        .seatName(s.getRowLabel() + s.getSeatNumber())
                        .seatType(s.getSeatType())
                        .price(s.getPrice())
                        .status(s.getStatus())
                        .build())
                .toList();
        return ApiResponse.<List<SeatStatusResponse>>builder().result(result).build();
    }
}

