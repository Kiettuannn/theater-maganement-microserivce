package com.theater_mgnt.microserivce.notification.provider;

import com.theater_mgnt.microserivce.notification.dto.EmailRequest;
import com.theater_mgnt.microserivce.notification.entity.Notification;
import com.theater_mgnt.microserivce.notification.entity.NotificationLog;
import com.theater_mgnt.microserivce.notification.service.EmailService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailChannelProvider implements NotificationChannelProvider {

    EmailService emailService;

    @Override
    public String getChannelName() {
        return "EMAIL";
    }

    @Override
    public NotificationLog send(Notification notification) {
        NotificationLog log = new NotificationLog();
        log.setNotification(notification);
        log.setChannelName(getChannelName());
        log.setSentAt(LocalDateTime.now());

        try {
            // Note: In real logic, we should use EmailTemplateFactory if HTML content is not yet rendered
            // But for raw Notification entities, we assume metadata contains htmlContent or we render it beforehand
            Map<String, Object> metadata = notification.getMetadata();
            String htmlContent = metadata.get("htmlContent") != null ? metadata.get("htmlContent").toString() : "";
            String subject = metadata.get("subject") != null ? metadata.get("subject").toString() : "Notification";
            String email = metadata.get("email") != null ? metadata.get("email").toString() : null;

            if (email == null) {
                log.setStatus("SKIPPED");
                log.setProviderResponse(Map.of("reason", "Missing email address"));
                return log;
            }

            EmailRequest emailRequest = EmailRequest.builder()
                    .to(List.of(new EmailRequest.Recipient(email, "Customer")))
                    .subject(subject)
                    .htmlContent(htmlContent)
                    .build();

            emailService.sendEmail(emailRequest);
            log.setStatus("SENT");
        } catch (Exception e) {
            log.setStatus("FAILED");
            log.setProviderResponse(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }

        return log;
    }
}
