package theater_mgnt.microserivce.payment_service.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import theater_mgnt.microserivce.payment_service.payment.client.dto.BookingSummaryResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDetailResponse {
    private String id;
    private String bookingId;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    /** Embedded from Booking Service via OpenFeign. May be null if service is unavailable. */
    private BookingSummaryResponse bookingDetails;
}
