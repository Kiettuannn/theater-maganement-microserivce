package theater_mgnt.microserivce.payment_service.payment.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * VNPay configuration bound from application.yaml prefix "vnpay".
 * Keys are injected via environment variables for production security.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "vnpay")
public class VNPayConfig {

    /** Terminal code (TmnCode) provided by VNPay */
    private String tmnCode;

    /** Secret key for HMAC-SHA512 signature */
    private String hashSecret;

    /** VNPay payment gateway URL */
    private String url;

    /** Callback URL after payment (redirect to your frontend) */
    private String returnUrl;

    /** API version — currently "2.1.0" */
    private String version;

    /** Command — "pay" for payment */
    private String command;

    /** Order type — "other" */
    private String orderType;
}
