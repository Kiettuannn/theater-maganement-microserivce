package com.theatermgnt.theatermgnt.screeningSeat.entity;

import java.time.Instant;

import jakarta.persistence.*;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import com.theatermgnt.theatermgnt.common.entity.BaseEntity;
import com.theatermgnt.theatermgnt.screening.entity.Screening;
import com.theatermgnt.theatermgnt.screeningSeat.enums.ScreeningSeatStatus;
import com.theatermgnt.theatermgnt.seat.entity.Seat;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "screeningSeats")
@SQLDelete(sql = "UPDATE screeningSeats SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class ScreeningSeat extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screeningId", nullable = false)
    Screening screening;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seatId", nullable = false)
    Seat seat;

    String booking;

    @Enumerated(EnumType.STRING)
    ScreeningSeatStatus status;

    Instant lockUntil;
}
