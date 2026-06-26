package theater_mgnt.microserivce.catalog.movie.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import theater_mgnt.microserivce.catalog.common.entity.BaseEntity;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "age_ratings")
public class AgeRating extends BaseEntity {
    String code;
    String description;
}

