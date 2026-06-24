package theater_mgnt.microserivce.booking_service.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import theater_mgnt.microserivce.booking_service.booking.enums.BookingStatus;
import theater_mgnt.microserivce.booking_service.common.entity.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@SQLDelete(sql = "UPDATE bookings SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking extends BaseEntity {

    @Column(name = "customer_id", nullable = false, length = 36)
    String customerId;

    @Column(name = "showtime_id", nullable = false, length = 36)
    String showtimeId;

    @Column(name = "showtime_title", length = 255)
    String showtimeTitle;

    @Column(name = "showtime_start_time")
    LocalDateTime showtimeStartTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    BookingStatus status;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    BigDecimal totalAmount;

    @Column(name = "expired_at")
    LocalDateTime expiredAt;
}
