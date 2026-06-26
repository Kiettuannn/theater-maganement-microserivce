package theater_mgnt.microserivce.payment_service.payment.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class InvoiceRefundedEvent {
    private String invoiceId;
    private String bookingId;
}
