package theater_mgnt.microserivce.payment_service.payment.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.payment_service.common.exception.AppException;
import theater_mgnt.microserivce.payment_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.payment_service.payment.client.BookingServiceClient;
import theater_mgnt.microserivce.payment_service.payment.client.dto.BookingSummaryResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.request.CreateInvoiceRequest;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceDetailResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceStatisticsResponse;
import theater_mgnt.microserivce.payment_service.payment.entity.Invoice;
import theater_mgnt.microserivce.payment_service.payment.entity.InvoiceStatus;
import theater_mgnt.microserivce.payment_service.payment.mapper.InvoiceMapper;
import theater_mgnt.microserivce.payment_service.payment.repository.InvoiceRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceMapper invoiceMapper;
    private final BookingServiceClient bookingServiceClient;

    // ── Create ──────────────────────────────────────────────────────────────

    /**
     * Manual invoice creation (HTTP fallback).
     * Calls Booking Service via Feign to get totalAmount.
     */
    @Override
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        log.info("Creating invoice (manual) for booking: {}", request.getBookingId());

        // Check if invoice already exists (idempotent)
        if (invoiceRepository.findByBookingId(request.getBookingId()).isPresent()) {
            log.info("Invoice already exists for booking {} — returning existing", request.getBookingId());
            Invoice existing = invoiceRepository.findByBookingId(request.getBookingId()).get();
            return invoiceMapper.toResponse(existing);
        }

        // Fetch booking details via Feign to get totalAmount
        BigDecimal totalAmount;
        try {
            var bookingResponse = bookingServiceClient.getBookingSummary(request.getBookingId());
            totalAmount = bookingResponse.getResult() != null
                    ? bookingResponse.getResult().getTotalAmount()
                    : BigDecimal.ZERO;
        } catch (Exception e) {
            log.error("Failed to fetch booking {} from Booking Service: {}", request.getBookingId(), e.getMessage());
            throw new AppException(ErrorCode.BOOKING_NOT_EXISTED);
        }

        Invoice invoice = Invoice.builder()
                .bookingId(request.getBookingId())
                .totalAmount(totalAmount)
                .status(InvoiceStatus.PENDING)
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice {} created for booking {}", saved.getId(), request.getBookingId());
        return invoiceMapper.toResponse(saved);
    }

    // ── Read ────────────────────────────────────────────────────────────────

    @Override
    public InvoiceResponse getInvoice(String invoiceId) {
        Invoice invoice = findOrThrow(invoiceId);
        return invoiceMapper.toResponse(invoice);
    }

    @Override
    public InvoiceResponse getInvoiceByBookingId(String bookingId) {
        Invoice invoice = invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_EXISTED));
        return invoiceMapper.toResponse(invoice);
    }

    /**
     * Returns invoice with embedded booking detail fetched via Feign.
     */
    @Override
    public InvoiceDetailResponse getInvoiceDetail(String invoiceId) {
        log.info("Fetching invoice detail: {}", invoiceId);
        Invoice invoice = findOrThrow(invoiceId);

        BookingSummaryResponse bookingDetails = null;
        try {
            var response = bookingServiceClient.getBookingSummary(invoice.getBookingId());
            bookingDetails = response.getResult();
        } catch (Exception e) {
            log.warn("Could not fetch booking details for invoice {} — booking service unavailable: {}",
                    invoiceId, e.getMessage());
            // Return invoice without booking details rather than failing completely
        }

        return InvoiceDetailResponse.builder()
                .id(invoice.getId())
                .bookingId(invoice.getBookingId())
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus().name())
                .createdAt(invoice.getCreatedAt())
                .paidAt(invoice.getPaidAt())
                .bookingDetails(bookingDetails)
                .build();
    }

    // ── Status Updates ───────────────────────────────────────────────────────

    @Override
    public InvoiceResponse updateInvoiceStatus(String invoiceId, InvoiceStatus status) {
        log.info("Updating invoice {} status → {}", invoiceId, status);
        Invoice invoice = findOrThrow(invoiceId);

        invoice.setStatus(status);
        if (status == InvoiceStatus.PAID) {
            invoice.setPaidAt(LocalDateTime.now());
        }

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice {} status updated to {}", invoiceId, status);
        return invoiceMapper.toResponse(saved);
    }

    @Override
    public InvoiceResponse markAsPaid(String invoiceId) {
        return updateInvoiceStatus(invoiceId, InvoiceStatus.PAID);
    }

    @Override
    public InvoiceResponse markAsFailed(String invoiceId) {
        return updateInvoiceStatus(invoiceId, InvoiceStatus.FAILED);
    }

    // ── List / Search ────────────────────────────────────────────────────────

    @Override
    public Page<InvoiceResponse> getAllInvoices(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return invoiceRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(invoiceMapper::toResponse);
    }

    @Override
    public Page<InvoiceResponse> getInvoicesByStatus(InvoiceStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return invoiceRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(invoiceMapper::toResponse);
    }

    @Override
    public Page<InvoiceResponse> getInvoicesByDateRange(
            LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return invoiceRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate, pageable)
                .map(invoiceMapper::toResponse);
    }

    @Override
    public Page<InvoiceResponse> searchInvoices(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return invoiceRepository.searchInvoices(search, pageable)
                .map(invoiceMapper::toResponse);
    }

    @Override
    public Page<InvoiceResponse> searchInvoicesByStatus(
            String search, InvoiceStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return invoiceRepository.searchInvoicesByStatus(search, status, pageable)
                .map(invoiceMapper::toResponse);
    }

    // ── Statistics ───────────────────────────────────────────────────────────

    @Override
    public InvoiceStatisticsResponse getStatistics() {
        Long totalInvoices   = invoiceRepository.count();
        Long pendingInvoices = invoiceRepository.countByStatus(InvoiceStatus.PENDING);
        Long paidInvoices    = invoiceRepository.countByStatus(InvoiceStatus.PAID);
        Long failedInvoices  = invoiceRepository.countByStatus(InvoiceStatus.FAILED);
        Long refundedInvoices= invoiceRepository.countByStatus(InvoiceStatus.REFUNDED);

        Double totalRevenue   = invoiceRepository.sumTotalAmountByStatus(InvoiceStatus.PAID);
        Double pendingAmount  = invoiceRepository.sumTotalAmountByStatus(InvoiceStatus.PENDING);
        Double refundedAmount = invoiceRepository.sumTotalAmountByStatus(InvoiceStatus.REFUNDED);

        return InvoiceStatisticsResponse.builder()
                .totalInvoices(totalInvoices)
                .pendingInvoices(pendingInvoices)
                .paidInvoices(paidInvoices)
                .failedInvoices(failedInvoices)
                .refundedInvoices(refundedInvoices)
                .totalRevenue(BigDecimal.valueOf(totalRevenue   != null ? totalRevenue   : 0))
                .pendingAmount(BigDecimal.valueOf(pendingAmount  != null ? pendingAmount  : 0))
                .refundedAmount(BigDecimal.valueOf(refundedAmount != null ? refundedAmount : 0))
                .build();
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private Invoice findOrThrow(String invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_EXISTED));
    }
}
