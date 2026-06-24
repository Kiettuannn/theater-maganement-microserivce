package theater_mgnt.microserivce.booking_service.ticket;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.booking.repository.BookingRepository;
import theater_mgnt.microserivce.booking_service.bookingCombo.service.BookingComboService;
import theater_mgnt.microserivce.booking_service.common.exception.AppException;
import theater_mgnt.microserivce.booking_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;
import theater_mgnt.microserivce.booking_service.seatReservation.repository.SeatReservationRepository;
import theater_mgnt.microserivce.booking_service.ticket.dto.request.TicketCheckInRequest;
import theater_mgnt.microserivce.booking_service.ticket.entity.Ticket;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;
import theater_mgnt.microserivce.booking_service.ticket.mapper.TicketMapper;
import theater_mgnt.microserivce.booking_service.ticket.repository.TicketRepository;
import theater_mgnt.microserivce.booking_service.ticket.service.QrGenerator;
import theater_mgnt.microserivce.booking_service.ticket.service.TicketCodeGenerator;
import theater_mgnt.microserivce.booking_service.ticket.service.TicketServiceImpl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TicketService – check-in và tạo vé")
class TicketServiceImplTest {

    @Mock TicketRepository ticketRepository;
    @Mock BookingRepository bookingRepository;
    @Mock SeatReservationRepository seatReservationRepository;
    @Mock BookingComboService bookingComboService;
    @Mock TicketMapper ticketMapper;
    @Mock TicketCodeGenerator ticketCodeGenerator;
    @Mock QrGenerator qrGenerator;

    @InjectMocks TicketServiceImpl ticketService;

    // =========================================================
    // CREATE TICKETS
    // =========================================================

    @Test
    @DisplayName("Tạo vé thành công: booking CONFIRMED → tạo ticket cho mỗi ghế")
    void createTickets_confirmed_success() {
        Booking booking = Booking.builder()
                .status(BookingStatus.CONFIRMED)
                .showtimeStartTime(LocalDateTime.now().plusDays(3))
                .build();
        booking.setId("booking-1");

        SeatReservation seat = SeatReservation.builder()
                .rowChair("A").seatNumber(1)
                .price(BigDecimal.valueOf(75000))
                .build();
        seat.setId("sr-1");

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(seatReservationRepository.findByBookingId("booking-1")).thenReturn(List.of(seat));
        when(ticketCodeGenerator.generate()).thenReturn("TKT-ABCD1234");
        when(ticketRepository.existsByTicketCode("TKT-ABCD1234")).thenReturn(false);
        when(qrGenerator.generateQrContent("TKT-ABCD1234")).thenReturn("qr://TKT-ABCD1234");

        ticketService.createTickets("booking-1");

        verify(ticketRepository).saveAll(argThat((List<Ticket> tickets) ->
                tickets.size() == 1 &&
                tickets.get(0).getTicketCode().equals("TKT-ABCD1234") &&
                tickets.get(0).getStatus() == TicketStatus.ACTIVE
        ));
    }

    @Test
    @DisplayName("Tạo vé: booking không phải CONFIRMED → BOOKING_CANNOT_CONFIRM")
    void createTickets_notConfirmed_throwsError() {
        Booking booking = Booking.builder().status(BookingStatus.PENDING).build();
        booking.setId("booking-1");
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> ticketService.createTickets("booking-1"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_CANNOT_CONFIRM));
    }

    // =========================================================
    // CHECK-IN TICKET
    // =========================================================

    @Test
    @DisplayName("Check-in vé ACTIVE thành công → trạng thái USED")
    void checkInTicket_active_success() {
        Ticket ticket = Ticket.builder()
                .ticketCode("TKT-ABCD1234")
                .status(TicketStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusHours(2))
                .build();

        when(ticketRepository.findByTicketCode("TKT-ABCD1234")).thenReturn(Optional.of(ticket));

        ticketService.checkInTicket(TicketCheckInRequest.builder()
                .ticketCode("TKT-ABCD1234").build());

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.USED);
        assertThat(ticket.getUsedAt()).isNotNull();
        verify(ticketRepository).save(ticket);
    }

    @Test
    @DisplayName("Check-in vé đã USED → TICKET_NOT_ACTIVE")
    void checkInTicket_alreadyUsed_throwsError() {
        Ticket ticket = Ticket.builder()
                .ticketCode("TKT-ABCD1234")
                .status(TicketStatus.USED)
                .expiresAt(LocalDateTime.now().plusHours(2))
                .build();

        when(ticketRepository.findByTicketCode("TKT-ABCD1234")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.checkInTicket(
                TicketCheckInRequest.builder().ticketCode("TKT-ABCD1234").build()))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.TICKET_NOT_ACTIVE));
    }

    @Test
    @DisplayName("Check-in vé đã EXPIRED (quá giờ) → TICKET_EXPIRED")
    void checkInTicket_expired_throwsError() {
        Ticket ticket = Ticket.builder()
                .ticketCode("TKT-ABCD1234")
                .status(TicketStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();

        when(ticketRepository.findByTicketCode("TKT-ABCD1234")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.checkInTicket(
                TicketCheckInRequest.builder().ticketCode("TKT-ABCD1234").build()))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.TICKET_EXPIRED));
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.EXPIRED);
    }

    @Test
    @DisplayName("Check-in vé không tồn tại → TICKET_NOT_EXISTED")
    void checkInTicket_notFound_throwsError() {
        when(ticketRepository.findByTicketCode("INVALID")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.checkInTicket(
                TicketCheckInRequest.builder().ticketCode("INVALID").build()))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.TICKET_NOT_EXISTED));
    }

    // =========================================================
    // EXPIRE TICKETS
    // =========================================================

    @Test
    @DisplayName("Expire scheduler: vé ACTIVE quá hạn → chuyển thành EXPIRED")
    void expireTickets_setsExpiredStatus() {
        Ticket t1 = Ticket.builder().status(TicketStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusHours(1)).build();
        Ticket t2 = Ticket.builder().status(TicketStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusMinutes(30)).build();

        when(ticketRepository.findAllByStatusAndExpiresAtBefore(eq(TicketStatus.ACTIVE), any()))
                .thenReturn(List.of(t1, t2));

        ticketService.expireTickets();

        assertThat(t1.getStatus()).isEqualTo(TicketStatus.EXPIRED);
        assertThat(t2.getStatus()).isEqualTo(TicketStatus.EXPIRED);
        verify(ticketRepository).saveAll(List.of(t1, t2));
    }
}
