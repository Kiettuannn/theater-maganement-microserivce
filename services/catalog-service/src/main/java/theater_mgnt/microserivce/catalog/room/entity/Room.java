package theater_mgnt.microserivce.catalog.room.entity;

import java.util.List;

import jakarta.persistence.*;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;


import theater_mgnt.microserivce.catalog.common.entity.BaseEntity;
import theater_mgnt.microserivce.catalog.common.enums.RoomType;
import theater_mgnt.microserivce.catalog.room.enums.RoomStatus;
import theater_mgnt.microserivce.catalog.seat.entity.Seat;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "rooms")
@SQLDelete(sql = "UPDATE rooms SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Room extends BaseEntity {


    String name;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "room", cascade = CascadeType.ALL)
    List<Seat> seats;

    @Enumerated(EnumType.STRING)
    RoomType roomType;

    @Enumerated(EnumType.STRING)
    RoomStatus status;

    Integer totalSeats;
}

