package theater_mgnt.microserivce.booking_service.bookingCombo.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.booking_service.common.entity.BaseEntity;

import java.math.BigDecimal;

@Entity
@Table(
    name = "booking_combos",
    indexes = {
        @Index(name = "idx_bc_booking", columnList = "booking_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingCombo extends BaseEntity {

    @Column(name = "booking_id", nullable = false, length = 36)
    String bookingId;

    @Column(name = "combo_id", nullable = false, length = 36)
    String comboId;

    @Column(name = "combo_name", nullable = false, length = 100)
    String comboName;

    @Column(nullable = false)
    Integer quantity;

    /** Remaining units — starts equal to quantity; decremented at check-in */
    @Column(nullable = false)
    Integer remain;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    BigDecimal unitPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal subtotal;
}
