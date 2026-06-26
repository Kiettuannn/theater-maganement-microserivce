package theater_mgnt.microserivce.catalog.priceConfig.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import theater_mgnt.microserivce.catalog.common.enums.DayType;
import theater_mgnt.microserivce.catalog.common.enums.TimeSlot;
import theater_mgnt.microserivce.catalog.priceConfig.entity.PriceConfig;

import java.util.List;
import java.util.Optional;

public interface PriceConfigRepository extends JpaRepository<PriceConfig, String> {
    List<PriceConfig> findBySeatTypeId(String seatTypeId);

    PriceConfig getPriceBySeatTypeIdAndDayTypeAndTimeSlot(String seatTypeId, DayType dayType, TimeSlot timeSlot);

    List<PriceConfig> findByDayTypeAndTimeSlot(DayType dayType, TimeSlot timeSlot);

    Optional<PriceConfig> findBySeatTypeIdAndDayTypeAndTimeSlot(String seatTypeId, DayType dayType, TimeSlot timeSlot);
}
