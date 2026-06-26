package theater_mgnt.microserivce.payment_service.payment.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.payment_service.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.request.CreateInvoiceRequest;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceDetailResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.response.InvoiceStatisticsResponse;
import theater_mgnt.microserivce.payment_service.payment.entity.InvoiceStatus;
import theater_mgnt.microserivce.payment_service.payment.service.InvoiceService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final InvoiceService invoiceService;

    /**
     * Manual invoice creation — fallback if Kafka event was missed.
     * Normally invoices are auto-created by BookingEventConsumer.
     */
    @PostMapping
    public ApiResponse<InvoiceResponse> createInvoice(@RequestBody CreateInvoiceRequest request) {
        log.info("Manual invoice creation for booking: {}", request.getBookingId());
        return ApiResponse.<InvoiceResponse>builder()
                .result(invoiceService.createInvoice(request))
                .build();
    }

    @GetMapping
    public ApiResponse<Page<InvoiceResponse>> getAllInvoices(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<Page<InvoiceResponse>>builder()
                .result(invoiceService.getAllInvoices(page, size))
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<Page<InvoiceResponse>> searchInvoices(
            @RequestParam String query,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<InvoiceResponse> result = (status != null)
                ? invoiceService.searchInvoicesByStatus(query, status, page, size)
                : invoiceService.searchInvoices(query, page, size);
        return ApiResponse.<Page<InvoiceResponse>>builder().result(result).build();
    }

    @GetMapping("/status/{status}")
    public ApiResponse<Page<InvoiceResponse>> getInvoicesByStatus(
            @PathVariable InvoiceStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<Page<InvoiceResponse>>builder()
                .result(invoiceService.getInvoicesByStatus(status, page, size))
                .build();
    }

    @GetMapping("/date-range")
    public ApiResponse<Page<InvoiceResponse>> getInvoicesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<Page<InvoiceResponse>>builder()
                .result(invoiceService.getInvoicesByDateRange(startDate, endDate, page, size))
                .build();
    }

    @GetMapping("/statistics")
    public ApiResponse<InvoiceStatisticsResponse> getStatistics() {
        return ApiResponse.<InvoiceStatisticsResponse>builder()
                .result(invoiceService.getStatistics())
                .build();
    }

    @GetMapping("/{invoiceId}")
    public ApiResponse<InvoiceResponse> getInvoice(@PathVariable String invoiceId) {
        return ApiResponse.<InvoiceResponse>builder()
                .result(invoiceService.getInvoice(invoiceId))
                .build();
    }

    @GetMapping("/{invoiceId}/detail")
    public ApiResponse<InvoiceDetailResponse> getInvoiceDetail(@PathVariable String invoiceId) {
        return ApiResponse.<InvoiceDetailResponse>builder()
                .result(invoiceService.getInvoiceDetail(invoiceId))
                .build();
    }

    @GetMapping("/booking/{bookingId}")
    public ApiResponse<InvoiceResponse> getInvoiceByBookingId(@PathVariable String bookingId) {
        return ApiResponse.<InvoiceResponse>builder()
                .result(invoiceService.getInvoiceByBookingId(bookingId))
                .build();
    }

    @PatchMapping("/{invoiceId}/status")
    public ApiResponse<InvoiceResponse> updateInvoiceStatus(
            @PathVariable String invoiceId, @RequestParam InvoiceStatus status) {
        return ApiResponse.<InvoiceResponse>builder()
                .result(invoiceService.updateInvoiceStatus(invoiceId, status))
                .build();
    }
}
