package theater_mgnt.microserivce.booking_service.seatReservation.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import theater_mgnt.microserivce.booking_service.common.entity.BaseEntity;
import theater_mgnt.microserivce.booking_service.seatReservation.enums.SeatReservationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "seat_reservations",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_seat_showtime", columnNames = {"showtime_id", "seat_id"})
    },
    indexes = {
        @Index(name = "idx_sr_showtime", columnList = "showtime_id"),
        @Index(name = "idx_sr_booking", columnList = "booking_id"),
        @Index(name = "idx_sr_status", columnList = "status")
    }
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

    @Column(name = "showtime_id", nullable = false, length = 36)
    String showtimeId;

    @Column(name = "seat_id", nullable = false, length = 36)
    String seatId;

    @Column(name = "booking_id", length = 36)
    String bookingId;

    // Snapshot from Catalog at lock time
    @Column(name = "row_chair", nullable = false, length = 5)
    String rowChair;

    @Column(name = "seat_number", nullable = false)
    Integer seatNumber;

    @Column(name = "seat_type_id", nullable = false, length = 36)
    String seatTypeId;

    @Column(name = "seat_type_name", nullable = false, length = 50)
    String seatTypeName;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    SeatReservationStatus status = SeatReservationStatus.AVAILABLE;

    @Column(name = "lock_until")
    LocalDateTime lockUntil;
}
