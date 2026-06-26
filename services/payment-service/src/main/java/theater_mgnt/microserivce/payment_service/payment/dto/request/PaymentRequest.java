package theater_mgnt.microserivce.payment_service.payment.dto.request;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    private String orderId;

    private Long amount;

    private String orderInfo;

    private String customerId;

    private String locale; // vn or en
}
