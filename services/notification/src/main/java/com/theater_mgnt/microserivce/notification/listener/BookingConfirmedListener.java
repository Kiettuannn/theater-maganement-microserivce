package com.theater_mgnt.microserivce.notification.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theater_mgnt.microserivce.notification.dto.event.OutboxEvent;
import com.theater_mgnt.microserivce.notification.dto.response.UserResponse;
import com.theater_mgnt.microserivce.notification.enums.EmailType;
import com.theater_mgnt.microserivce.notification.enums.RecipientType;
import com.theater_mgnt.microserivce.notification.httpClient.IdentityClient;
import com.theater_mgnt.microserivce.notification.service.EmailTemplateFactory;
import com.theater_mgnt.microserivce.notification.service.NotificationService;
import com.theater_mgnt.microserivce.notification.service.SocketIOService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingConfirmedListener {

    NotificationService notificationService;
    EmailTemplateFactory emailTemplateFactory;
    IdentityClient identityClient;
    SocketIOService socketIOService;
    ObjectMapper objectMapper;

    @KafkaListener(topics = "cinema.booking.booking-confirmed", groupId = "${spring.kafka.consumer.group-id}")
    public void handleBookingConfirmed(String message) {
        log.info("Received BookingConfirmedEvent message");
        try {
            OutboxEvent event = objectMapper.readValue(message, OutboxEvent.class);
            if (!"BookingConfirmed".equals(event.getEventType())) {
                return;
            }

            Map<String, Object> payload = event.getPayload();
            String bookingId = (String) payload.get("bookingId");
            String userId = (String) payload.get("userId");
            String showtimeDate = (String) payload.get("showtimeDate");
            
            Number ticketRevenue = (Number) payload.get("ticketRevenue");
            Number totalTicketsSold = (Number) payload.get("totalTicketsSold");

            // 1. Get user email
            UserResponse user = identityClient.getUser(userId);
            if (user == null || user.getEmail() == null) {
                log.warn("Cannot fetch user or email for userId: {}", userId);
                return;
            }

            String name = (user.getLastName() != null ? user.getLastName() : "") + " " + (user.getFirstName() != null ? user.getFirstName() : "");

            // 2. Prepare Email
            Map<String, Object> variables = Map.of(
                    "name", name,
                    "bookingId", bookingId,
                    "showtimeDate", showtimeDate,
                    "totalTickets", totalTicketsSold,
                    "revenue", ticketRevenue
            );
            
            String htmlContent = emailTemplateFactory.buildTemplate(EmailType.TICKET_ISSUE, variables);

            Map<String, Object> metadata = Map.of(
                    "subject", "Vé của bạn đã được xuất thành công! Mã: BK-" + bookingId.substring(0, Math.min(8, bookingId.length())).toUpperCase(),
                    "htmlContent", htmlContent,
                    "email", user.getEmail(),
                    "category", "TRANSACTIONAL"
            );

            // 3. Dispatch Email
            notificationService.createAndSend(
                    bookingId,
                    RecipientType.CUSTOMER,
                    metadata,
                    List.of("EMAIL")
            );
            
            // 4. Send Push Notification via Socket.IO
            Map<String, Object> socketPayload = Map.of(
                    "type", "BOOKING_CONFIRMED",
                    "title", "Thanh toán thành công",
                    "message", "Vé của bạn cho ngày " + showtimeDate + " đã được xác nhận.",
                    "bookingId", bookingId
            );
            socketIOService.emitNotificationToUser(userId, socketPayload);
            
            log.info("Processed booking confirmed notification for userId: {}", userId);
            
        } catch (Exception e) {
            log.error("Failed to process BookingConfirmedEvent", e);
        }
    }
}
