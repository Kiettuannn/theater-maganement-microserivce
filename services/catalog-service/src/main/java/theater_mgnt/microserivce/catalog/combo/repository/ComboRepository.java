package theater_mgnt.microserivce.catalog.combo.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import theater_mgnt.microserivce.catalog.combo.entity.Combo;

public interface ComboRepository extends JpaRepository<Combo, String> {
    boolean existsByName(String name);
}
