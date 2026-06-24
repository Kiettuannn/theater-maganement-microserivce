package theater_mgnt.microserivce.catalog.seat.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import theater_mgnt.microserivce.catalog.common.entity.BaseEntity;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "seats")
@SQLDelete(sql = "UPDATE seats SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Seat extends BaseEntity {
    String rowChair;
    Integer seatNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_type_id", nullable = false)
    SeatType seatType;
}
