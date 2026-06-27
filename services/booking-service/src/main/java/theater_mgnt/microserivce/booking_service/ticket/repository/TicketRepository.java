package theater_mgnt.microserivce.booking_service.ticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import theater_mgnt.microserivce.booking_service.ticket.entity.Ticket;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, String> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    boolean existsByTicketCode(String ticketCode);

    List<Ticket> findAllByStatusAndExpiresAtBefore(TicketStatus status, Instant time);

    List<Ticket> findByBookingId(String bookingId);

    List<Ticket> findByBookingIdAndStatus(String bookingId, TicketStatus status);

    List<Ticket> findByBookingIdIn(List<String> bookingIds);
}
