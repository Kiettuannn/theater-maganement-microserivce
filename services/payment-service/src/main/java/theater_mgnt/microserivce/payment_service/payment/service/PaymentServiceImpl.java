package theater_mgnt.microserivce.payment_service.payment.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import theater_mgnt.microserivce.payment_service.common.exception.AppException;
import theater_mgnt.microserivce.payment_service.common.exception.ErrorCode;
import theater_mgnt.microserivce.payment_service.payment.config.VNPayConfig;
import theater_mgnt.microserivce.payment_service.payment.dto.response.PaymentDetailsResponse;
import theater_mgnt.microserivce.payment_service.payment.entity.Invoice;
import theater_mgnt.microserivce.payment_service.payment.entity.InvoiceStatus;
import theater_mgnt.microserivce.payment_service.payment.entity.Payment;
import theater_mgnt.microserivce.payment_service.payment.entity.PaymentType;
import theater_mgnt.microserivce.payment_service.payment.enums.PaymentStatus;
import theater_mgnt.microserivce.payment_service.payment.event.producer.PaymentEventProducer;
import theater_mgnt.microserivce.payment_service.payment.repository.InvoiceRepository;
import theater_mgnt.microserivce.payment_service.payment.repository.PaymentMethodRepository;
import theater_mgnt.microserivce.payment_service.payment.repository.PaymentRepository;
import theater_mgnt.microserivce.payment_service.payment.util.VNPayUtil;

import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final VNPayConfig vnPayConfig;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final InvoiceService invoiceService;
    private final PaymentEventProducer paymentEventProducer;

    // ── VNPay Payment ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentDetailsResponse createVNPayPayment(
            String invoiceId, HttpServletRequest httpRequest, String returnUrlOverride) {
        try {
            Invoice invoice = findInvoiceOrThrow(invoiceId);

            if (invoice.getStatus() == InvoiceStatus.PAID) {
                throw new AppException(ErrorCode.INVOICE_ALREADY_PAID);
            }

            // Get VNPay payment method record
            var vnpayMethod = paymentMethodRepository.findByName("VNPay")
                    .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_METHOD_NOT_EXISTED));

            String txnRef = "VNPAY" + VNPayUtil.getRandomNumber(10);

            // ── DEMO MODE ─────────────────────────────────────────────────────
            // For demo/testing: immediately mark payment as SUCCESS without
            // going through the actual VNPay redirect + IPN flow.
            // Remove this block and uncomment the section below for production.

            Payment payment = Payment.builder()
                    .invoiceId(invoiceId)
                    .paymentMethodId(vnpayMethod.getId())
                    .amount(invoice.getTotalAmount())
                    .paymentType(PaymentType.BOOKING)
                    .transactionCode(txnRef)
                    .status(PaymentStatus.SUCCESS)
                    .paymentDate(LocalDateTime.now())
                    .description("VNPay payment (demo) for invoice: " + invoiceId)
                    .build();
            paymentRepository.save(payment);

            // Mark invoice PAID
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());
            invoiceRepository.save(invoice);

            // Publish PaymentConfirmed → Booking Service confirms booking + creates tickets
            try {
                paymentEventProducer.publishPaymentConfirmed(
                        payment.getId(),
                        invoice.getId(),
                        invoice.getBookingId(),
                        txnRef,
                        invoice.getTotalAmount(),
                        "VNPAY");
            } catch (Exception e) {
                log.error("Failed to publish PaymentConfirmed for VNPay demo payment on booking {}: {}",
                        invoice.getBookingId(), e.getMessage(), e);
            }

            log.info("VNPay DEMO payment processed for invoice {} — booking {} will be confirmed via Kafka",
                    invoiceId, invoice.getBookingId());

            return PaymentDetailsResponse.builder()
                    .code("00")
                    .message("VNPay payment successful (demo mode)")
                    .id(payment.getId())
                    .transactionCode(txnRef)
                    .invoiceId(invoiceId)
                    .amount(invoice.getTotalAmount())
                    .status(PaymentStatus.SUCCESS.name())
                    .build();

            // ── END DEMO MODE ─────────────────────────────────────────────────

            /*
             * ── PRODUCTION MODE (uncomment below, remove DEMO MODE block above) ──
             *
             * String txnRefProd = VNPayUtil.getRandomNumber(12);
             * String sanitized  = invoiceId.replace("-", "");
             * String orderInfo  = "INV" + sanitized.substring(Math.max(0, sanitized.length() - 8));
             *
             * Payment paymentProd = Payment.builder()
             *         .invoiceId(invoiceId)
             *         .paymentMethodId(vnpayMethod.getId())
             *         .amount(invoice.getTotalAmount())
             *         .paymentType(PaymentType.BOOKING)
             *         .transactionCode(txnRefProd)
             *         .status(PaymentStatus.PENDING)
             *         .description("VNPay payment for invoice: " + invoiceId)
             *         .build();
             * paymentRepository.save(paymentProd);
             *
             * Map<String, String> vnpParams = new TreeMap<>();
             * vnpParams.put("vnp_Version",   vnPayConfig.getVersion());
             * vnpParams.put("vnp_Command",   vnPayConfig.getCommand());
             * vnpParams.put("vnp_TmnCode",   vnPayConfig.getTmnCode());
             * vnpParams.put("vnp_Amount",    String.valueOf(invoice.getTotalAmount().longValue() * 100));
             * vnpParams.put("vnp_CurrCode",  "VND");
             * vnpParams.put("vnp_TxnRef",    txnRefProd);
             * vnpParams.put("vnp_OrderInfo", orderInfo);
             * vnpParams.put("vnp_OrderType", vnPayConfig.getOrderType());
             * vnpParams.put("vnp_Locale",    "vn");
             *
             * String effectiveReturnUrl = (returnUrlOverride != null && !returnUrlOverride.isBlank())
             *         ? returnUrlOverride : vnPayConfig.getReturnUrl();
             * vnpParams.put("vnp_ReturnUrl", effectiveReturnUrl);
             * vnpParams.put("vnp_IpAddr",    VNPayUtil.getIpAddress(httpRequest));
             *
             * Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
             * String vnpCreateDate = new SimpleDateFormat("yyyyMMddHHmmss").format(cld.getTime());
             * vnpParams.put("vnp_CreateDate", vnpCreateDate);
             *
             * String hashData   = VNPayUtil.hashAllFields(vnpParams);
             * String secureHash = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);
             * String queryUrl   = VNPayUtil.getPaymentURL(vnpParams, false);
             * String paymentUrl = vnPayConfig.getUrl() + "?" + queryUrl + "&vnp_SecureHash=" + secureHash;
             *
             * log.info("VNPay payment created — txnRef: {}, invoiceId: {}, amount: {}",
             *         txnRefProd, invoiceId, invoice.getTotalAmount());
             *
             * return PaymentDetailsResponse.builder()
             *         .code("00")
             *         .message("Success")
             *         .paymentUrl(paymentUrl)
             *         .id(paymentProd.getId())
             *         .transactionCode(txnRefProd)
             *         .invoiceId(invoiceId)
             *         .amount(invoice.getTotalAmount())
             *         .status(PaymentStatus.PENDING.name())
             *         .build();
             */

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating VNPay payment for invoice {}: {}", invoiceId, e.getMessage(), e);
            throw new AppException(ErrorCode.PAYMENT_PROCESSING_ERROR);
        }
    }

    // ── VNPay Callback (user redirect — NOT authoritative) ───────────────────

    @Override
    public Map<String, Object> handleVNPayCallback(Map<String, String> params) {
        Map<String, Object> response = new HashMap<>();
        try {
            String vnpSecureHash = params.remove("vnp_SecureHash");
            String hashData      = VNPayUtil.hashAllFieldsForCallback(params);
            String calcHash      = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);

            if (!calcHash.equalsIgnoreCase(vnpSecureHash)) {
                response.put("code",    "97");
                response.put("message", "Invalid signature");
                return response;
            }

            String txnRef    = params.get("vnp_TxnRef");
            String respCode  = params.get("vnp_ResponseCode");

            Optional<Payment> paymentOpt = paymentRepository.findByTransactionCode(txnRef);
            if (paymentOpt.isEmpty()) {
                response.put("code", "01"); response.put("message", "Payment not found");
                return response;
            }

            Payment payment = paymentOpt.get();
            // Callback is informational — IPN is authoritative.
            // Just return info for frontend navigation.
            boolean success = "00".equals(respCode);
            response.put("code",      success ? "00" : respCode);
            response.put("message",   success ? "Payment successful" : "Payment failed: " + respCode);
            response.put("paymentId", payment.getId());
            response.put("invoiceId", payment.getInvoiceId());
            response.put("txnRef",    txnRef);

            invoiceRepository.findById(payment.getInvoiceId())
                    .ifPresent(inv -> response.put("bookingId", inv.getBookingId()));

            String amountParam = params.get("vnp_Amount");
            if (amountParam != null) {
                response.put("amount", Long.parseLong(amountParam) / 100);
            }

        } catch (Exception e) {
            log.error("Error handling VNPay callback", e);
            response.put("code", "99"); response.put("message", "Error: " + e.getMessage());
        }
        return response;
    }

    // ── VNPay IPN (server-to-server — authoritative) ─────────────────────────

    @Override
    @Transactional
    public Map<String, Object> handleVNPayIPN(Map<String, String> params) {
        Map<String, Object> response = new HashMap<>();
        try {
            String vnpSecureHash = params.remove("vnp_SecureHash");
            String hashData      = VNPayUtil.hashAllFieldsForCallback(params);
            String calcHash      = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);

            if (!calcHash.equalsIgnoreCase(vnpSecureHash)) {
                response.put("RspCode", "97"); response.put("Message", "Invalid signature");
                log.warn("VNPay IPN signature mismatch");
                return response;
            }

            String txnRef = params.get("vnp_TxnRef");
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionCode(txnRef);
            if (paymentOpt.isEmpty()) {
                response.put("RspCode", "01"); response.put("Message", "Payment not found");
                return response;
            }

            Payment payment = paymentOpt.get();

            // Idempotent — already processed
            if (payment.getStatus() != PaymentStatus.PENDING) {
                response.put("RspCode", "02"); response.put("Message", "Payment already processed");
                return response;
            }

            // Verify amount
            long vnpAmount = Long.parseLong(params.get("vnp_Amount")) / 100;
            if (payment.getAmount().longValue() != vnpAmount) {
                response.put("RspCode", "04"); response.put("Message", "Invalid amount");
                return response;
            }

            String respCode = params.get("vnp_ResponseCode");
            if ("00".equals(respCode)) {
                // ── SUCCESS ──────────────────────────────────────────────────
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaymentDate(LocalDateTime.now());
                paymentRepository.save(payment);

                // Mark invoice PAID
                Optional<Invoice> invoiceOpt = invoiceRepository.findById(payment.getInvoiceId());
                if (invoiceOpt.isPresent()) {
                    Invoice invoice = invoiceOpt.get();
                    invoice.setStatus(InvoiceStatus.PAID);
                    invoice.setPaidAt(LocalDateTime.now());
                    invoiceRepository.save(invoice);

                    // Publish PaymentConfirmed → Booking Service confirms booking + creates tickets
                    try {
                        paymentEventProducer.publishPaymentConfirmed(
                                payment.getId(),
                                invoice.getId(),
                                invoice.getBookingId(),
                                payment.getTransactionCode(),
                                payment.getAmount(),
                                "VNPAY");
                    } catch (Exception e) {
                        log.error("Failed to publish PaymentConfirmed for booking {}: {}",
                                invoice.getBookingId(), e.getMessage(), e);
                        // Don't fail IPN — Kafka retry will handle it
                    }

                    log.info("VNPay IPN: Invoice {} PAID, PaymentConfirmed published for booking {}",
                            invoice.getId(), invoice.getBookingId());
                }

                response.put("RspCode", "00"); response.put("Message", "Confirm success");

            } else {
                // ── FAILURE ──────────────────────────────────────────────────
                payment.setStatus(PaymentStatus.FAILED);
                payment.setPaymentDate(LocalDateTime.now());
                paymentRepository.save(payment);

                Optional<Invoice> invoiceOpt = invoiceRepository.findById(payment.getInvoiceId());
                invoiceOpt.ifPresent(invoice -> {
                    try {
                        paymentEventProducer.publishPaymentFailed(
                                payment.getId(),
                                invoice.getId(),
                                invoice.getBookingId(),
                                payment.getTransactionCode(),
                                "VNPay response code: " + respCode);
                    } catch (Exception e) {
                        log.error("Failed to publish PaymentFailed event: {}", e.getMessage());
                    }
                });

                log.warn("VNPay IPN: payment {} FAILED — response code {}", payment.getId(), respCode);
                response.put("RspCode", "00"); // VNPay spec: always return 00 to acknowledge receipt
                response.put("Message", "Confirm success");
            }

        } catch (Exception e) {
            log.error("Error handling VNPay IPN", e);
            response.put("RspCode", "99"); response.put("Message", "Unknown error");
        }
        return response;
    }

    // ── Cash Payment ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentDetailsResponse processCashPayment(String invoiceId) {
        try {
            log.info("Processing cash payment for invoice: {}", invoiceId);

            Invoice invoice = findInvoiceOrThrow(invoiceId);

            if (invoice.getStatus() == InvoiceStatus.PAID) {
                throw new AppException(ErrorCode.INVOICE_ALREADY_PAID);
            }

            var cashMethod = paymentMethodRepository.findByName("Cash")
                    .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_METHOD_NOT_EXISTED));

            String txnRef = "CASH" + VNPayUtil.getRandomNumber(10);

            // Create payment record — immediately SUCCESS
            Payment payment = Payment.builder()
                    .invoiceId(invoiceId)
                    .paymentMethodId(cashMethod.getId())
                    .amount(invoice.getTotalAmount())
                    .paymentType(PaymentType.BOOKING)
                    .transactionCode(txnRef)
                    .status(PaymentStatus.SUCCESS)
                    .paymentDate(LocalDateTime.now())
                    .description("Cash payment for invoice: " + invoiceId)
                    .build();
            paymentRepository.save(payment);

            // Mark invoice PAID
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());
            invoiceRepository.save(invoice);

            // Publish PaymentConfirmed → Booking Service confirms booking + creates tickets
            try {
                paymentEventProducer.publishPaymentConfirmed(
                        payment.getId(),
                        invoice.getId(),
                        invoice.getBookingId(),
                        txnRef,
                        invoice.getTotalAmount(),
                        "CASH");
            } catch (Exception e) {
                log.error("Failed to publish PaymentConfirmed for cash payment on booking {}: {}",
                        invoice.getBookingId(), e.getMessage(), e);
                // Payment is already saved — Kafka retry will handle publication
            }

            log.info("Cash payment processed for invoice {} — booking {} will be confirmed via Kafka",
                    invoiceId, invoice.getBookingId());

            return PaymentDetailsResponse.builder()
                    .code("00")
                    .message("Cash payment successful")
                    .id(payment.getId())
                    .transactionCode(txnRef)
                    .invoiceId(invoiceId)
                    .amount(invoice.getTotalAmount())
                    .status(PaymentStatus.SUCCESS.name())
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing cash payment for invoice {}: {}", invoiceId, e.getMessage(), e);
            throw new AppException(ErrorCode.PAYMENT_PROCESSING_ERROR);
        }
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private Invoice findInvoiceOrThrow(String invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_EXISTED));
    }
}
