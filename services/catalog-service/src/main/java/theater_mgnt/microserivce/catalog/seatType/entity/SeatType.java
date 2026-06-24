package theater_mgnt.microserivce.catalog.seatType.entity;


import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import theater_mgnt.microserivce.catalog.common.entity.BaseEntity;

import java.math.BigDecimal;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "seatTypes")
@SQLDelete(sql = "UPDATE seatTypes SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class SeatType extends BaseEntity {

    String typeName;
    BigDecimal basePriceModifier;
}
