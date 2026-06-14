package theater_mgnt.microserivce.booking_service.combo.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import theater_mgnt.microserivce.booking_service.combo.entity.ComboItem;

import java.util.List;

public interface ComboItemRepository extends JpaRepository<ComboItem, String> {
    List<ComboItem> findByComboId(String comboId);

    boolean existsByNameAndComboId(String name, String comboId);
}
