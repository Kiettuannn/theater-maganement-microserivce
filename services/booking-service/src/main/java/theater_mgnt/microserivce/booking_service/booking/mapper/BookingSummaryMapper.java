package theater_mgnt.microserivce.booking_service.booking.mapper;

import org.mapstruct.Mapper;
import theater_mgnt.microserivce.booking_service.booking.dto.response.BookingSummaryResponse;
import theater_mgnt.microserivce.booking_service.booking.dto.response.SeatSummaryResponse;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.bookingCombo.dto.response.ComboSummaryResponse;
import theater_mgnt.microserivce.booking_service.bookingCombo.entity.BookingCombo;
import theater_mgnt.microserivce.booking_service.seatReservation.entity.SeatReservation;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BookingSummaryMapper {

    default BookingSummaryResponse toSummaryResponse(
            Booking booking,
            List<SeatReservation> seats,
            List<BookingCombo> combos) {

        List<SeatSummaryResponse> seatResponses = seats.stream()
                .map(s -> SeatSummaryResponse.builder()
                        .seatId(s.getSeatId())
                        .seatReservationId(s.getId())
                        .rowChair(s.getRowChair())
                        .seatNumber(s.getSeatNumber())
                        .seatName(s.getRowChair() + s.getSeatNumber())
                        .seatTypeName(s.getSeatTypeName())
                        .price(s.getPrice())
                        .status(s.getStatus())
                        .build())
                .toList();

        List<ComboSummaryResponse> comboResponses = combos.stream()
                .map(c -> {
                    ComboSummaryResponse cs = new ComboSummaryResponse();
                    cs.setComboId(c.getComboId());
                    cs.setComboName(c.getComboName());
                    cs.setQuantity(c.getQuantity());
                    cs.setUnitPrice(c.getUnitPrice());
                    cs.setSubtotal(c.getSubtotal());
                    return cs;
                })
                .toList();

        return BookingSummaryResponse.builder()
                .bookingId(booking.getId())
                .status(booking.getStatus())
                .expiredAt(booking.getExpiredAt())
                .showtimeId(booking.getShowtimeId())
                .showtimeTitle(booking.getShowtimeTitle())
                .showtimeStartTime(booking.getShowtimeStartTime())
                .seats(seatResponses)
                .combos(comboResponses)
                .totalAmount(booking.getTotalAmount())
                .build();
    }
}
