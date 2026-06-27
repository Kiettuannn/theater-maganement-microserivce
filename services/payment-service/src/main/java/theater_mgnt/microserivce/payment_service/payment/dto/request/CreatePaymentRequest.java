package theater_mgnt.microserivce.payment_service.payment.dto.request;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {

    private String invoiceId;

    private String paymentMethodId;

    private BigDecimal amount;

    private String description;
}
