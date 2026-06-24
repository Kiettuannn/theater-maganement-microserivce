package theater_mgnt.microserivce.catalog.seatType.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import theater_mgnt.microserivce.catalog.seatType.entity.SeatType;

public interface SeatTypeRepository extends JpaRepository<SeatType, String> {
    boolean existsByTypeName(String typeName);
}
