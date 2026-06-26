package theater_mgnt.microserivce.payment_service.payment.controller;


import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.payment_service.common.dto.response.ApiResponse;
import theater_mgnt.microserivce.payment_service.payment.dto.response.PaymentDetailsResponse;
import theater_mgnt.microserivce.payment_service.payment.service.PaymentService;

import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Create VNPay payment URL for invoice
     * POST /api/theater-mgnt/payment/vnpay/{invoiceId}
     */
    @PostMapping("/vnpay/{invoiceId}")
    public ApiResponse<PaymentDetailsResponse> createVNPayPayment(
            @PathVariable String invoiceId,
            @RequestParam(value = "returnUrl", required = false) String returnUrl,
            HttpServletRequest httpRequest) {
        log.info("Creating VNPay payment for invoice: {}, returnUrl: {}", invoiceId, returnUrl);
        PaymentDetailsResponse response = paymentService.createVNPayPayment(invoiceId, httpRequest, returnUrl);
        return ApiResponse.<PaymentDetailsResponse>builder().result(response).build();
    }

    /**
     * VNPay return URL (user redirect after payment)
     * GET /api/theater-mgnt/payment/vnpay-return
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<Map<String, Object>> vnpayReturn(@RequestParam Map<String, String> params) {
        log.info("VNPay return callback");
        Map<String, Object> response = paymentService.handleVNPayCallback(params);
        return ResponseEntity.ok(response);
    }

    /**
     * VNPay IPN (Instant Payment Notification)
     * GET /api/theater-mgnt/payment/vnpay-ipn
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, Object>> vnpayIPN(@RequestParam Map<String, String> params) {
        log.info("VNPay IPN callback");
        Map<String, Object> response = paymentService.handleVNPayIPN(params);
        return ResponseEntity.ok(response);
    }

    /**
     * Process cash payment for invoice
     * POST /api/theater-mgnt/payment/cash/{invoiceId}
     */
    @PostMapping("/cash/{invoiceId}")
    public ApiResponse<PaymentDetailsResponse> processCashPayment(@PathVariable String invoiceId) {
        log.info("Processing cash payment for invoice: {}", invoiceId);
        PaymentDetailsResponse response = paymentService.processCashPayment(invoiceId);
        return ApiResponse.<PaymentDetailsResponse>builder().result(response).build();
    }
}
