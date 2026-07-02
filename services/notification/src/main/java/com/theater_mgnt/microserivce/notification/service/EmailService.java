package com.theater_mgnt.microserivce.notification.service;

import com.theater_mgnt.microserivce.notification.dto.EmailRequest;
import com.theater_mgnt.microserivce.notification.httpClient.EmailClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmailService {

    final EmailClient emailClient;

    @Value("${brevo.apiKey}")
    String apiKey;

    @Value("${brevo.sender.email}")
    String senderEmail;

    @Value("${brevo.sender.name}")
    String senderName;

    public void sendEmail(EmailRequest emailRequest) {
        if (emailRequest.getSender() == null) {
            emailRequest.setSender(new EmailRequest.Sender(senderName, senderEmail));
        }

        try {
            emailClient.sendEmail(apiKey, emailRequest);
            log.info("Email sent successfully to {}", emailRequest.getTo());
        } catch (FeignException e) {
            log.error("Failed to send email via Brevo. Status: {}, Body: {}", e.status(), e.contentUTF8());
            throw new RuntimeException("EMAIL_SEND_FAILED");
        } catch (Exception e) {
            log.error("Unknown error while sending email", e);
            throw new RuntimeException("EMAIL_SEND_FAILED");
        }
    }
}
