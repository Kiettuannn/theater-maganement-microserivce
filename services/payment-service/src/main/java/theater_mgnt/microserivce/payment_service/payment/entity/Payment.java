package theater_mgnt.microserivce.payment_service.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import theater_mgnt.microserivce.payment_service.payment.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Records a single payment attempt for an Invoice.
 * One Invoice may have multiple Payment attempts (e.g. failed VNPay then cash).
 * Only one should reach SUCCESS.
 */
@Entity
@Table(name = "payments",
    indexes = {
        @Index(name = "ix_payment_invoice_id", columnList = "invoice_id"),
        @Index(name = "ix_payment_transaction_code", columnList = "transaction_code")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "invoice_id", nullable = false, length = 36)
    String invoiceId;

    @Column(name = "payment_method_id", nullable = false, length = 36)
    String paymentMethodId;

    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 20)
    PaymentType paymentType;

    /** VNPay txnRef or CASH+random for cash payments */
    @Column(name = "transaction_code", unique = true, length = 100)
    String transactionCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    PaymentStatus status;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "payment_date")
    LocalDateTime paymentDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}
