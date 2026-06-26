package theater_mgnt.microserivce.payment_service.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDetailsResponse {

    private String id;
    private String invoiceId;
    private String paymentMethodId;
    private BigDecimal amount;
    private String paymentType;
    private String transactionCode;
    private String status;
    private String description;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;

    // For VNPay redirect
    private String paymentUrl;
    private String code;
    private String message;
}
