package theater_mgnt.microserivce.booking_service.ticket.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import theater_mgnt.microserivce.booking_service.booking.entity.Booking;
import theater_mgnt.microserivce.booking_service.ticket.enums.TicketStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "tickets",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_ticket_code", columnNames = "ticket_code"),
        @UniqueConstraint(name = "uq_ticket_seat_reservation", columnNames = "seat_reservation_id")
    },
    indexes = {
        @Index(name = "idx_ticket_booking", columnList = "booking_id"),
        @Index(name = "idx_ticket_status", columnList = "status")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    Booking booking;

    @Column(name = "seat_reservation_id", nullable = false, length = 36)
    String seatReservationId;

    @Column(name = "seat_name", nullable = false, length = 10)
    String seatName;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    @Column(name = "ticket_code", nullable = false, unique = true, length = 50)
    String ticketCode;

    @Column(name = "qr_content", nullable = false, columnDefinition = "TEXT")
    String qrContent;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    TicketStatus status = TicketStatus.ACTIVE;

    @Column(name = "used_at")
    LocalDateTime usedAt;

    @Column(name = "expires_at", nullable = false)
    LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;
}
