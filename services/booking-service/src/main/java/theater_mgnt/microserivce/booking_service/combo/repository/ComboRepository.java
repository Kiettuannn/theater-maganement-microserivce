package theater_mgnt.microserivce.booking_service.combo.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import theater_mgnt.microserivce.booking_service.combo.entity.Combo;

public interface ComboRepository extends JpaRepository<Combo, String> {
    boolean existsByName(String name);
}
