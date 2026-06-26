package theater_mgnt.microserivce.payment_service.payment.service;

import org.springframework.data.domain.Page;
import theater_mgnt.microserivce.payment_service.payment.dto.request.CreateInvoiceRequest;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceDetailResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceStatisticsResponse;
import theater_mgnt.microserivce.payment_service.payment.entity.InvoiceStatus;

import java.time.LocalDateTime;

public interface InvoiceService {

    /**
     * Manual invoice creation (fallback HTTP endpoint if Kafka event missed).
     * Calls Booking Service via Feign to get booking details.
     */
    InvoiceResponse createInvoice(CreateInvoiceRequest request);

    InvoiceResponse getInvoice(String invoiceId);

    /**
     * Invoice detail with embedded booking summary (fetched via Feign).
     */
    InvoiceDetailResponse getInvoiceDetail(String invoiceId);

    InvoiceResponse getInvoiceByBookingId(String bookingId);

    InvoiceResponse updateInvoiceStatus(String invoiceId, InvoiceStatus status);

    InvoiceResponse markAsPaid(String invoiceId);

    InvoiceResponse markAsFailed(String invoiceId);

    Page<InvoiceResponse> getAllInvoices(int page, int size);

    Page<InvoiceResponse> getInvoicesByStatus(InvoiceStatus status, int page, int size);

    Page<InvoiceResponse> getInvoicesByDateRange(
            LocalDateTime startDate, LocalDateTime endDate, int page, int size);

    Page<InvoiceResponse> searchInvoices(String search, int page, int size);

    Page<InvoiceResponse> searchInvoicesByStatus(
            String search, InvoiceStatus status, int page, int size);

    InvoiceStatisticsResponse getStatistics();
}
