package com.theater_mgnt.microserivce.notification.listener;

import com.theater_mgnt.microserivce.notification.dto.event.CustomerRegisteredEvent;
import com.theater_mgnt.microserivce.notification.enums.EmailType;
import com.theater_mgnt.microserivce.notification.enums.RecipientType;
import com.theater_mgnt.microserivce.notification.service.EmailTemplateFactory;
import com.theater_mgnt.microserivce.notification.service.NotificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class CustomerRegistrationListener {

    final NotificationService notificationService;
    final EmailTemplateFactory emailTemplateFactory;

    @Value("${app.frontend.login-url:http://localhost:3000/login}")
    String loginUrl;

    @KafkaListener(topics = "${kafka.topics.customer-registered:customer.registered}", groupId = "${spring.kafka.consumer.group-id}")
    public void handleCustomerRegistration(CustomerRegisteredEvent event) {
        log.info("Received CustomerRegisteredEvent for email: {}", event.getEmail());

        try {
            // 1. Prepare variables for Thymeleaf template
            Map<String, Object> variables = Map.of(
                    "name", event.getLastName() + " " + event.getFirstName(),
                    "username", event.getEmail(),
                    "password", event.getRawPassword() != null ? event.getRawPassword() : "******",
                    "loginUrl", loginUrl
            );

            // 2. Render HTML content
            String htmlContent = emailTemplateFactory.buildTemplate(EmailType.WELCOME_CUSTOMER, variables);

            // 3. Prepare metadata
            Map<String, Object> metadata = Map.of(
                    "subject", "Welcome " + event.getFirstName() + " to Cifastar HCM!",
                    "htmlContent", htmlContent,
                    "email", event.getEmail(),
                    "category", "SYSTEM"
            );

            // 4. Dispatch notification
            notificationService.createAndSend(
                    event.getId(),
                    RecipientType.CUSTOMER,
                    metadata,
                    List.of("EMAIL")
            );
            log.info("Successfully dispatched welcome email for user: {}", event.getEmail());
        } catch (Exception e) {
            log.error("Failed to process CustomerRegisteredEvent for {}", event.getEmail(), e);
        }
    }
}
