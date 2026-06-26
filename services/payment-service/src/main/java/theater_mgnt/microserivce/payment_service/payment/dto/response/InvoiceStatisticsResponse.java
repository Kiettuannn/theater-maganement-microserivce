package theater_mgnt.microserivce.payment_service.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceStatisticsResponse {
    private Long totalInvoices;
    private Long pendingInvoices;
    private Long paidInvoices;
    private Long failedInvoices;
    private Long refundedInvoices;
    private BigDecimal totalRevenue;
    private BigDecimal pendingAmount;
    private BigDecimal refundedAmount;
}
