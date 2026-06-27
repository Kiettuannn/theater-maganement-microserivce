package theater_mgnt.microserivce.booking_service.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.common.entity.BaseEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
    name = "bookings",
    indexes = {
        @Index(name = "ix_bookings_user_id",     columnList = "user_id"),
        @Index(name = "ix_bookings_showtime_id",  columnList = "showtime_id"),
        @Index(name = "ix_bookings_status",       columnList = "status")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "ux_bookings_idempotency", columnNames = "idempotency_key")
    }
)
@SQLDelete(sql = "UPDATE bookings SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking extends BaseEntity {

    /** Identity Service user; resolved from JWT sub claim */
    @Column(name = "user_id", nullable = false, length = 36)
    String userId;

    @Column(name = "showtime_id", nullable = false, length = 36)
    String showtimeId;

    /** hall (screen room) within the cinema — room_id */
    @Column(name = "room_id", length = 36)
    String roomId;

    /** Partition column — used for PARTITION BY RANGE (showtime_date) */
    @Column(name = "showtime_date")
    LocalDate showtimeDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    BookingStatus status = BookingStatus.INITIATED;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    BigDecimal totalAmount;

    /** ISO 4217 currency code */
    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    String currency = "VND";

    /** Client-supplied per booking attempt; prevents duplicate bookings */
    @Column(name = "idempotency_key", nullable = false, length = 36)
    String idempotencyKey;

    /** payment_id echoed from Payment Service on confirmation */
    @Column(name = "payment_ref", length = 36)
    String paymentRef;

    /** Seat-hold expiry (created_at + 8 minutes) */
    @Column(name = "expires_at", nullable = false)
    Instant expiresAt;

    /** Set when payment was confirmed */
    @Column(name = "confirmed_at")
    Instant confirmedAt;

    /** Set when booking was cancelled */
    @Column(name = "cancelled_at")
    Instant cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    String cancellationReason;

    /** Optimistic locking — incremented on every UPDATE */
    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    Long version = 0L;

    // ── Derived (application-level, not stored) ────────────────────────────
    /** bookingCode = "BK-" + id.substring(0,8).toUpperCase() */
    @Transient
    public String getBookingCode() {
        return id != null ? "BK-" + id.substring(0, Math.min(8, id.length())).toUpperCase() : null;
    }
}
