package theater_mgnt.microserivce.payment_service.payment.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VNPayCallbackRequest {
    private String vnp_TmnCode;
    private String vnp_Amount;
    private String vnp_BankCode;
    private String vnp_BankTranNo;
    private String vnp_CardType;
    private String vnp_PayDate;
    private String vnp_OrderInfo;
    private String vnp_TransactionNo;
    private String vnp_ResponseCode;
    private String vnp_TransactionStatus;
    private String vnp_TxnRef;
    private String vnp_SecureHashType;
    private String vnp_SecureHash;

    public static VNPayCallbackRequest fromMap(Map<String, String> params) {
        return VNPayCallbackRequest.builder()
                .vnp_TmnCode(params.get("vnp_TmnCode"))
                .vnp_Amount(params.get("vnp_Amount"))
                .vnp_BankCode(params.get("vnp_BankCode"))
                .vnp_BankTranNo(params.get("vnp_BankTranNo"))
                .vnp_CardType(params.get("vnp_CardType"))
                .vnp_PayDate(params.get("vnp_PayDate"))
                .vnp_OrderInfo(params.get("vnp_OrderInfo"))
                .vnp_TransactionNo(params.get("vnp_TransactionNo"))
                .vnp_ResponseCode(params.get("vnp_ResponseCode"))
                .vnp_TransactionStatus(params.get("vnp_TransactionStatus"))
                .vnp_TxnRef(params.get("vnp_TxnRef"))
                .vnp_SecureHashType(params.get("vnp_SecureHashType"))
                .vnp_SecureHash(params.get("vnp_SecureHash"))
                .build();
    }
}
