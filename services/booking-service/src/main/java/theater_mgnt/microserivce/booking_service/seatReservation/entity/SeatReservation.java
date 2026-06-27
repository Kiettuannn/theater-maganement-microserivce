package theater_mgnt.microserivce.booking_service.seatReservation.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import theater_mgnt.microserivce.booking_service.common.entity.BaseEntity;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "seat_reservations",
    indexes = {
        @Index(name = "ix_seat_res_booking_id",      columnList = "booking_id"),
        @Index(name = "ix_seat_res_showtime_status",  columnList = "showtime_id, status")
    }
    // NOTE: partial unique index ux_seat_res_showtime_seat (showtime_id, seat_id) WHERE status NOT IN ('CANCELLED')
    // must be created via Flyway/Liquibase DDL — JPA @UniqueConstraint does not support WHERE clauses.
)
@SQLDelete(sql = "UPDATE seat_reservations SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatReservation extends BaseEntity {

    /** FK to parent booking; nullable for pre-populated AVAILABLE rows (set at booking time) */
    @Column(name = "booking_id", length = 36)
    String bookingId;

    /** Routing key; mirrors bookings.showtime_id */
    @Column(name = "showtime_id", nullable = false, length = 36)
    String showtimeId;

    /** Cross-domain ref to Catalog/Hall Service seat (no FK constraint) */
    @Column(name = "seat_id", nullable = false, length = 36)
    String seatId;

    /** Room (hall) that the seat belongs to — snapshotted from ShowtimeCreated event */
    @Column(name = "room_id", length = 36)
    String roomId;

    /** Showtime end time — snapshotted from ShowtimeCreated event; used as Ticket.expiresAt */
    @Column(name = "showtime_end_time")
    java.time.Instant showtimeEndTime;

    /** Showtime start time — snapshotted from ShowtimeCreated event; used to derive showtimeDate */
    @Column(name = "showtime_start_time")
    java.time.Instant showtimeStartTime;

    /** e.g. "A", "B" — snapshot from Catalog at lock time */
    @Column(name = "row_label", nullable = false, length = 4)
    String rowLabel;

    @Column(name = "seat_number", nullable = false)
    Integer seatNumber;

    /** STANDARD, PREMIUM, or VIP */
    @Column(name = "seat_type", nullable = false, length = 32)
    String seatType;

    /** Immutable snapshot from showtime pricing; never recalculated */
    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    SeatReservationStatus status = SeatReservationStatus.AVAILABLE;

    /** Mirror of the Redis key stored for audit/debugging */
    @Column(name = "redis_lock_key", length = 255)
    String redisLockKey;

    /** When the seat was locked */
    @Column(name = "locked_at")
    Instant lockedAt;

    /** Set when booking transitions to CONFIRMED */
    @Column(name = "confirmed_at")
    Instant confirmedAt;

    /** When seat was released back to AVAILABLE */
    @Column(name = "released_at")
    Instant releasedAt;
}
