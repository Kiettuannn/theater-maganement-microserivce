package theater_mgnt.microserivce.booking_service.ticket.service;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TicketCodeGenerator {
    public String generate() {
        return "TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
