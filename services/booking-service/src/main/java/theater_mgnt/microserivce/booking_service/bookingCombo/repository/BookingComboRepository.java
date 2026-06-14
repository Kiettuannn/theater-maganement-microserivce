package theater_mgnt.microserivce.booking_service.bookingCombo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import theater_mgnt.microserivce.booking_service.bookingCombo.entity.BookingCombo;

import java.math.BigDecimal;
import java.util.List;

public interface BookingComboRepository extends JpaRepository<BookingCombo, String> {
    void deleteByBookingId(String bookingId);

    @Query("""
		SELECT COALESCE(SUM(bc.subtotal), 0)
		FROM BookingCombo bc
		WHERE bc.bookingId = :bookingId
	""")
    BigDecimal sumSubtotalByBookingId(@Param("bookingId") String bookingId);

    List<BookingCombo> findByBookingId(String bookingId);
}
