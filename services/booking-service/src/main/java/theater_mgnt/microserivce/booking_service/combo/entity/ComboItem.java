package theater_mgnt.microserivce.booking_service.combo.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import theater_mgnt.microserivce.booking_service.common.entity.BaseEntity;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "comboItems")
@SQLDelete(sql = "UPDATE comboItems SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class ComboItem extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comboId", nullable = false)
    Combo combo;

    String name;
    Integer quantity;
}
