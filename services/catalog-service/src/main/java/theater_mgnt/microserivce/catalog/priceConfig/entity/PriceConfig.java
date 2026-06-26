package theater_mgnt.microserivce.catalog.priceConfig.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import theater_mgnt.microserivce.catalog.common.entity.BaseEntity;
import theater_mgnt.microserivce.catalog.common.enums.DayType;
import theater_mgnt.microserivce.catalog.common.enums.TimeSlot;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;

import java.math.BigDecimal;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "priceConfigs")
@SQLDelete(sql = "UPDATE priceConfigs SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class PriceConfig extends BaseEntity {

    @Enumerated(EnumType.STRING)
    DayType dayType;

    @Enumerated(EnumType.STRING)
    TimeSlot timeSlot;

    @Column(precision = 10, scale = 2)
    BigDecimal price;

    // Quan hệ nhiều-1 với SeatType
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seatTypeId", nullable = false)
    SeatType seatType;
}
