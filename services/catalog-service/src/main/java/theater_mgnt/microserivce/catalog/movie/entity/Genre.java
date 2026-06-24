package theater_mgnt.microserivce.catalog.movie.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "genres")
public class Genre extends BaseEntity {
    String name;

    @ManyToMany(mappedBy = "genres")
    @JsonIgnore
    private Set<Movie> movies = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Genre)) return false;
        Genre genre = (Genre) o;
        return id != null && id.equals(genre.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

