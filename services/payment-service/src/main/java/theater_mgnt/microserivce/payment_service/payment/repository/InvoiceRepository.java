package theater_mgnt.microserivce.payment_service.payment.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import theater_mgnt.microserivce.payment_service.payment.entity.Invoice;
import theater_mgnt.microserivce.payment_service.payment.entity.InvoiceStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {

    Optional<Invoice> findByBookingId(String bookingId);

    List<Invoice> findByStatus(InvoiceStatus status);

    Page<Invoice> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Invoice> findByStatusOrderByCreatedAtDesc(InvoiceStatus status, Pageable pageable);

    Page<Invoice> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<Invoice> findByStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
            InvoiceStatus status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /** Full-text search on id or bookingId */
    @Query("SELECT i FROM Invoice i WHERE " +
           "(LOWER(i.id) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(i.bookingId) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.createdAt DESC")
    Page<Invoice> searchInvoices(@Param("search") String search, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE " +
           "(LOWER(i.id) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(i.bookingId) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND i.status = :status ORDER BY i.createdAt DESC")
    Page<Invoice> searchInvoicesByStatus(
            @Param("search") String search,
            @Param("status") InvoiceStatus status,
            Pageable pageable);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status")
    Long countByStatus(@Param("status") InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status = :status")
    Double sumTotalAmountByStatus(@Param("status") InvoiceStatus status);
}
