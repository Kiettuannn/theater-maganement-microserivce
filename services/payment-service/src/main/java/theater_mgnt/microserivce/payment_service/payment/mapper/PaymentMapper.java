package theater_mgnt.microserivce.payment_service.payment.mapper;

import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.payment_service.payment.dto.response.PaymentDetailsResponse;
import theater_mgnt.microserivce.payment_service.payment.entity.Payment;

@Component
public class PaymentMapper {

    public PaymentDetailsResponse toResponse(Payment payment) {
        if (payment == null) {
            return null;
        }
        return PaymentDetailsResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoiceId())
                .paymentMethodId(payment.getPaymentMethodId())
                .amount(payment.getAmount())
                .paymentType(payment.getPaymentType() != null ? payment.getPaymentType().name() : null)
                .transactionCode(payment.getTransactionCode())
                .status(payment.getStatus() != null ? payment.getStatus().name() : null)
                .description(payment.getDescription())
                .paymentDate(payment.getPaymentDate())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
