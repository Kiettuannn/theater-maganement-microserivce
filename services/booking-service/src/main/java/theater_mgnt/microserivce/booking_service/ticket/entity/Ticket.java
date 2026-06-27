package theater_mgnt.microserivce.booking_service.ticket.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import theater_mgnt.microserivce.booking_service.common.entity.BaseEntity;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "tickets",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_ticket_code",             columnNames = "ticket_code"),
        @UniqueConstraint(name = "uq_ticket_seat_reservation", columnNames = "seat_reservation_id")
    },
    indexes = {
        @Index(name = "idx_ticket_booking", columnList = "booking_id"),
        @Index(name = "idx_ticket_status",  columnList = "status")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Ticket extends BaseEntity {

    /** Plain FK — no JPA @ManyToOne join to avoid cross-aggregate coupling */
    @Column(name = "booking_id", nullable = false, length = 36)
    String bookingId;

    /** References seat_reservations.id (replaces monolith screeningSeat) */
    @Column(name = "seat_reservation_id", nullable = false, length = 36)
    String seatReservationId;

    /** Denormalized: rowLabel + seatNumber, e.g. "A1" */
    @Column(name = "seat_name", length = 10)
    String seatName;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    /** "TK-" + UUID(8 chars uppercase) */
    @Column(name = "ticket_code", nullable = false, unique = true, length = 50)
    String ticketCode;

    /** JSON string: {"type":"TICKET","ticketCode":"TK-XXXXXXXX"} */
    @Column(name = "qr_content", nullable = false, columnDefinition = "TEXT")
    String qrContent;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    TicketStatus status = TicketStatus.ACTIVE;

    @Column(name = "used_at")
    Instant usedAt;

    /** = showtime.endTime (converted to UTC from Asia/Ho_Chi_Minh) */
    @Column(name = "expires_at", nullable = false)
    Instant expiresAt;
}
