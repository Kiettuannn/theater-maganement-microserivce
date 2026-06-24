package theater_mgnt.microserivce.booking_service.ticket.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Component
public class QrImageGenerator {
    public String generateBase64Qr(String qrContent) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(qrContent, BarcodeFormat.QR_CODE, 200, 200);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);

            return Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR image", e);
        }
    }
}
