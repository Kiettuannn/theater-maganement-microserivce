package com.theater_mgnt.microserivce.notification.controller;

import com.theater_mgnt.microserivce.event.dto.NotificationEvent;
import com.theater_mgnt.microserivce.notification.dto.EmailRequest;
import com.theater_mgnt.microserivce.notification.service.EmailService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class NotificationController {
    EmailService emailService;

    @KafkaListener(topics = "notification-delivery")
    public void listenNotificationDelivery(NotificationEvent message){
        log.info("Message received: {}", message);
        emailService.sendEmail(EmailRequest.builder()
                        .to(List.of(new EmailRequest.Recipient(message.getRecipient(), null)))
                        .subject(message.getSubject())
                        .htmlContent(message.getBody())
                .build());
    }
}
