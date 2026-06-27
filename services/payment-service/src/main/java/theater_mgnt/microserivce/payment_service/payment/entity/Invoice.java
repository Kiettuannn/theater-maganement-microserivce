package theater_mgnt.microserivce.payment_service.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String bookingId; // Foreign key to Booking

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount; // VND

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status; // pending, paid, failed, refunded

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime paidAt;
}
