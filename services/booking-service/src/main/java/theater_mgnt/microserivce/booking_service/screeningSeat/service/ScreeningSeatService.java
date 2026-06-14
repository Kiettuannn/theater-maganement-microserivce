package com.theatermgnt.theatermgnt.screeningSeat.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.theatermgnt.theatermgnt.common.enums.DayType;
import com.theatermgnt.theatermgnt.common.enums.TimeSlot;
import com.theatermgnt.theatermgnt.common.exception.AppException;
import com.theatermgnt.theatermgnt.common.exception.ErrorCode;
import com.theatermgnt.theatermgnt.priceConfig.entity.PriceConfig;
import com.theatermgnt.theatermgnt.priceConfig.repository.PriceConfigRepository;
import com.theatermgnt.theatermgnt.screening.entity.Screening;
import com.theatermgnt.theatermgnt.screening.repository.ScreeningRepository;
import com.theatermgnt.theatermgnt.screeningSeat.dto.request.ScreeningSeatCreationRequest;
import com.theatermgnt.theatermgnt.screeningSeat.dto.request.ScreeningSeatUpdateRequest;
import com.theatermgnt.theatermgnt.screeningSeat.dto.response.ScreeningSeatResponse;
import com.theatermgnt.theatermgnt.screeningSeat.entity.ScreeningSeat;
import com.theatermgnt.theatermgnt.screeningSeat.enums.ScreeningSeatStatus;
import com.theatermgnt.theatermgnt.screeningSeat.mapper.ScreeningSeatMapper;
import com.theatermgnt.theatermgnt.screeningSeat.repository.ScreeningSeatRepository;
import com.theatermgnt.theatermgnt.seat.entity.Seat;
import com.theatermgnt.theatermgnt.seat.repository.SeatRepository;
import com.theatermgnt.theatermgnt.ticket.entity.Ticket;
import com.theatermgnt.theatermgnt.ticket.enums.TicketStatus;
import com.theatermgnt.theatermgnt.ticket.repository.TicketRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScreeningSeatService {
    SeatRepository seatRepository;
    ScreeningRepository screeningRepository;
    ScreeningSeatRepository screeningSeatRepository;
    ScreeningSeatMapper screeningSeatMapper;
    PriceConfigRepository priceConfigRepository;
    TicketRepository ticketRepository;

    @Transactional(propagation = Propagation.REQUIRED)
    public ScreeningSeatResponse createScreeningSeat(ScreeningSeatCreationRequest request) {
        Screening screening = screeningRepository
                .findById(request.getScreeningId())
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_NOT_EXISTED));

        Seat seat = seatRepository
                .findById(request.getSeatId())
                .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_EXISTED));

        if (screeningSeatRepository.existsByScreeningIdAndSeatId(request.getScreeningId(), request.getSeatId()))
            throw new AppException(ErrorCode.SCREENING_SEAT_EXISTED);

        if (!seat.getRoom().getId().equals(screening.getRoom().getId()))
            throw new AppException(ErrorCode.SEAT_NOT_IN_ROOM);

        ScreeningSeat screeningSeat = screeningSeatMapper.toScreeningSeat(request);
        screeningSeat.setSeat(seat);
        screeningSeat.setScreening(screening);
        screeningSeat.setStatus(ScreeningSeatStatus.AVAILABLE);

        return mapSeatToResponse(screeningSeatRepository.save(screeningSeat));
    }

    public List<ScreeningSeatResponse> getScreeningSeatsByScreeningId(String screeningId) {
        return mapSeatsListToResponses(screeningSeatRepository.findByScreeningId(screeningId));
    }

    public List<ScreeningSeatResponse> getScreeningSeatsBySeatId(String seatId) {
        return mapSeatsListToResponses(screeningSeatRepository.findBySeatId(seatId));
    }

    public List<ScreeningSeatResponse> getScreeningSeats() {
        return mapSeatsListToResponses(screeningSeatRepository.findAll());
    }

    public ScreeningSeatResponse getScreeningSeat(String screeningSeatId) {
        ScreeningSeat screeningSeat = screeningSeatRepository
                .findById(screeningSeatId)
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_SEAT_NOT_EXISTED));
        return mapSeatToResponse(screeningSeat);
    }

    public ScreeningSeatResponse updateScreeningSeat(String screeningSeatId, ScreeningSeatUpdateRequest request) {
        ScreeningSeat screeningSeat = screeningSeatRepository
                .findById(screeningSeatId)
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_SEAT_NOT_EXISTED));

        if (screeningSeat.getStatus() == ScreeningSeatStatus.SOLD
                && request.getStatus() == ScreeningSeatStatus.AVAILABLE) {
            throw new AppException(ErrorCode.SCREENING_SEAT_INVALID_STATUS_CHANGE);
        }

        screeningSeatMapper.updateScreeningSeat(screeningSeat, request);
        return mapSeatToResponse(screeningSeatRepository.save(screeningSeat));
    }

    public void deleteScreeningSeat(String screeningSeatId) {
        ScreeningSeat ss = screeningSeatRepository
                .findById(screeningSeatId)
                .orElseThrow(() -> new AppException(ErrorCode.SCREENING_SEAT_NOT_EXISTED));
        if (ss.getStatus() == ScreeningSeatStatus.SOLD) throw new AppException(ErrorCode.SCREENING_SEAT_CANNOT_DELETE);
        screeningSeatRepository.deleteById(screeningSeatId);
    }

    private List<ScreeningSeatResponse> mapSeatsListToResponses(List<ScreeningSeat> seats) {
        if (seats == null || seats.isEmpty()) {
            return new ArrayList<>();
        }

        List<ScreeningSeatResponse> finalResult = new ArrayList<>();

        // Gom nhóm ghế theo Suất chiếu (Screening)
        // Map<Screening, List<ScreeningSeat>>
        Map<Screening, List<ScreeningSeat>> seatsByScreening =
                seats.stream().collect(Collectors.groupingBy(ScreeningSeat::getScreening));

        for (Map.Entry<Screening, List<ScreeningSeat>> entry : seatsByScreening.entrySet()) {
            Screening screening = entry.getKey();
            List<ScreeningSeat> seatsInGroup = entry.getValue();

            TimeSlot timeSlot = TimeSlot.from(screening.getStartTime().toLocalTime());
            DayType dayType = DayType.from(screening.getStartTime().toLocalDate());

            List<PriceConfig> priceConfigs = priceConfigRepository.findByDayTypeAndTimeSlot(dayType, timeSlot);

            Map<String, BigDecimal> priceMap = priceConfigs.stream()
                    .collect(Collectors.toMap(
                            config -> config.getSeatType().getId(),
                            PriceConfig::getPrice,
                            (existing, replacement) -> existing));

            // Get transfer tickets for this screening
            List<String> screeningSeatIds =
                    seatsInGroup.stream().map(ScreeningSeat::getId).toList();
            List<Ticket> transferTickets =
                    ticketRepository.findByScreeningSeatIdInAndStatus(screeningSeatIds, TicketStatus.FOR_TRANSFER);

            Map<String, Ticket> transferTicketMap = transferTickets.stream()
                    .collect(Collectors.toMap(
                            ticket -> ticket.getScreeningSeat().getId(), ticket -> ticket, (t1, t2) -> t1));

            List<ScreeningSeatResponse> groupResponses = seatsInGroup.stream()
                    .map(seat -> {
                        ScreeningSeatResponse response = screeningSeatMapper.toScreeningSeatResponse(seat, priceMap);

                        // Add transfer information if available
                        Ticket transferTicket = transferTicketMap.get(seat.getId());
                        if (transferTicket != null) {
                            response.setIsForTransfer(true);
                            response.setTransferTicketId(transferTicket.getId().toString());

                            if (transferTicket.getBooking() != null
                                    && transferTicket.getBooking().getCustomer() != null) {
                                var customer = transferTicket.getBooking().getCustomer();
                                var account = customer.getAccount();

                                response.setSellerName((customer.getFirstName() != null ? customer.getFirstName() : "")
                                        + " "
                                        + (customer.getLastName() != null ? customer.getLastName() : ""));
                                response.setSellerEmail(account != null ? account.getEmail() : null);
                                response.setSellerPhone(customer.getPhoneNumber());
                            }
                        } else {
                            response.setIsForTransfer(false);
                        }

                        return response;
                    })
                    .toList();

            finalResult.addAll(groupResponses);
        }

        return finalResult;
    }

    private ScreeningSeatResponse mapSeatToResponse(ScreeningSeat seat) {
        if (seat == null) return null;

        List<ScreeningSeatResponse> results = mapSeatsListToResponses(List.of(seat));
        return results.isEmpty() ? null : results.getFirst();
    }
}
