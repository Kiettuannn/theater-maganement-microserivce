package theater_mgnt.microserivce.booking_service.ticket.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketExpireScheduler {
    private final TicketService ticketService;

    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void expireTicketsJob() {

        log.info("Running ticket expiration job");

        ticketService.expireTickets();

        log.info("Ticket expiration job finished");
    }
}
