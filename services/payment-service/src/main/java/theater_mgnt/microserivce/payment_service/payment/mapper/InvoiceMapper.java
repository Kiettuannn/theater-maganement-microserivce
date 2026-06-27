package theater_mgnt.microserivce.payment_service.payment.mapper;


import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceResponse;
import theater_mgnt.microserivce.payment_service.payment.entity.Invoice;

@Component
public class InvoiceMapper {

    public InvoiceResponse toResponse(Invoice invoice) {
        if (invoice == null) {
            return null;
        }

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .bookingId(invoice.getBookingId())
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus().name())
                .createdAt(invoice.getCreatedAt())
                .paidAt(invoice.getPaidAt())
                .build();
    }
}
