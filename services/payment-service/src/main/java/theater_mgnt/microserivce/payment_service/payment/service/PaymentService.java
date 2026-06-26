package theater_mgnt.microserivce.payment_service.payment.service;

import jakarta.servlet.http.HttpServletRequest;
import theater_mgnt.microserivce.payment_service.payment.dto.response.PaymentDetailsResponse;

import java.util.Map;

public interface PaymentService {

    /**
     * Build VNPay payment URL for an existing invoice.
     * Returns a redirect URL the frontend uses to send the user to VNPay.
     */
    PaymentDetailsResponse createVNPayPayment(
            String invoiceId, HttpServletRequest httpRequest, String returnUrlOverride);

    /**
     * Handle VNPay return URL redirect (user-facing callback after payment).
     * NOT the authoritative source — use IPN for status updates.
     */
    Map<String, Object> handleVNPayCallback(Map<String, String> params);

    /**
     * Handle VNPay IPN (Instant Payment Notification) — server-to-server.
     * This is the authoritative payment confirmation.
     * On success: marks Invoice PAID, publishes PaymentConfirmed Kafka event.
     */
    Map<String, Object> handleVNPayIPN(Map<String, String> params);

    /**
     * Process cash payment directly (no VNPay redirect).
     * On success: marks Invoice PAID, publishes PaymentConfirmed Kafka event.
     */
    PaymentDetailsResponse processCashPayment(String invoiceId);
}
