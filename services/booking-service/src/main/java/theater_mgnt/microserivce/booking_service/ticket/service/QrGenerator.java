package theater_mgnt.microserivce.booking_service.ticket.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class QrGenerator {
    private final ObjectMapper objectMapper;

    public String generateQrContent(String ticketCode) {
        try {
            Map<String, Object> payload = Map.of("type", "TICKET", "ticketCode", ticketCode);
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR content", e);
        }
    }
}
