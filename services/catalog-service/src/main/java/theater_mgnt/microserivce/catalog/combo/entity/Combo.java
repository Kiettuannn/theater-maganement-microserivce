package theater_mgnt.microserivce.catalog.combo.entity;


import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;


import lombok.*;
import lombok.experimental.FieldDefaults;
import theater_mgnt.microserivce.catalog.common.entity.BaseEntity;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "combos")
@SQLDelete(sql = "UPDATE combos SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Combo extends BaseEntity {
    String name;
    String description;
    BigDecimal price;
    String imageUrl;
}
