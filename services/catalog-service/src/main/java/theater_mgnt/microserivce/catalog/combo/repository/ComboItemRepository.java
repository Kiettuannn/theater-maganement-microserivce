package theater_mgnt.microserivce.catalog.combo.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import theater_mgnt.microserivce.catalog.combo.entity.ComboItem;

import java.util.List;

public interface ComboItemRepository extends JpaRepository<ComboItem, String> {
    List<ComboItem> findByComboId(String comboId);

    boolean existsByNameAndComboId(String name, String comboId);
}
