package theater_mgnt.microserivce.payment_service.payment.util;

import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Slf4j
public class VNPayUtil {

    /**
     * Generate HMAC SHA512 hash
     */
    public static String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            // VNPay expects hex in uppercase
            return bytesToHex(result).toUpperCase();
        } catch (Exception ex) {
            log.error("Error generating HMAC SHA512", ex);
            return "";
        }
    }

    /**
     * Convert bytes to hex string
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    /**
     * Generate MD5 hash
     */
    public static String md5(String message) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(message.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            log.error("Error generating MD5", ex);
            return "";
        }
    }

    /**
     * Generate SHA256 hash
     */
    public static String sha256(String message) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(message.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            log.error("Error generating SHA256", ex);
            return "";
        }
    }

    /**
     * Build hash data from params (keys & values must be URL encoded, sorted asc)
     * Used for creating payment request
     */
    public static String hashAllFields(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();

        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!first) {
                    sb.append("&");
                }
                sb.append(encode(fieldName));
                sb.append("=");
                sb.append(encode(fieldValue));
                first = false;
            }
        }
        return sb.toString();
    }

    /**
     * Build hash data from callback params (raw values, no encoding, sorted asc)
     * Used for verifying VNPay callback/IPN
     */
    public static String hashAllFieldsForCallback(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();

        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!first) {
                    sb.append("&");
                }
                sb.append(fieldName);
                sb.append("=");
                sb.append(fieldValue);
                first = false;
            }
        }
        return sb.toString();
    }

    /**
     * Build query string from params (keys & values URL encoded, sorted asc)
     */
    public static String getPaymentURL(Map<String, String> params, boolean encodeKey) {
        StringBuilder data = new StringBuilder();
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!data.isEmpty()) {
                    data.append("&");
                }
                // Always encode both key and value per VNPay spec
                data.append(encode(fieldName));
                data.append("=");
                data.append(encode(fieldValue));
            }
        }
        return data.toString();
    }

    // Helper: URL-encode with UTF-8, replace "+" with "%20" per VNPay spec
    private static String encode(String input) {
        try {
            return URLEncoder.encode(input, StandardCharsets.UTF_8.toString()).replace("+", "%20");
        } catch (UnsupportedEncodingException e) {
            log.error("Error encoding string", e);
            return input;
        }
    }

    /**
     * Get random number for transaction ref
     */
    public static String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Get IP Address from request
     */
    public static String getIpAddress(jakarta.servlet.http.HttpServletRequest request) {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");

        if (ipAddress != null && !ipAddress.isEmpty()) {
            // Take the first IP if there are multiple (client, proxy1, proxy2,...)
            int commaIndex = ipAddress.indexOf(',');
            if (commaIndex > 0) {
                ipAddress = ipAddress.substring(0, commaIndex).trim();
            }
        } else {
            ipAddress = request.getRemoteAddr();
        }

        // Normalize IPv6 loopback to IPv4 loopback for VNPay
        if ("0:0:0:0:0:0:0:1".equals(ipAddress) || "::1".equals(ipAddress)) {
            ipAddress = "127.0.0.1";
        }

        return ipAddress;
    }
}
