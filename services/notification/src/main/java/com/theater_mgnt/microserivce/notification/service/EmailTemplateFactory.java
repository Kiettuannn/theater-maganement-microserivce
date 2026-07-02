package com.theater_mgnt.microserivce.notification.service;

import com.theater_mgnt.microserivce.notification.enums.EmailType;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.Year;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailTemplateFactory {

    SpringTemplateEngine templateEngine;

    public String buildTemplate(EmailType emailType, Map<String, Object> variables) {
        Context context = new Context();
        context.setVariables(variables);
        
        // Add global variables
        context.setVariable("appName", "Cifastar HCM");
        context.setVariable("companyName", "Cifastar");
        context.setVariable("companyUrl", "https://cifastar.com");
        context.setVariable("companyAddress", "123 Cifastar St, HCM City, Vietnam");
        context.setVariable("year", Year.now().getValue());

        String templateFile = getTemplatePath(emailType);
        return templateEngine.process(templateFile, context);
    }

    private String getTemplatePath(EmailType emailType) {
        switch (emailType) {
            case RESET_PASSWORD:
                return "email/reset-password";
            case WELCOME_STAFF:
                return "email/welcome-staff";
            case NOTIFICATION_EMAIL:
                return "email/notification-email";
            case TICKET_ISSUE:
                return "email/ticket-issue";
            case WELCOME_CUSTOMER:
                return "email/welcome-customer";
            case REFUND_NOTIFICATION:
                return "email/refund-notification";
            default:
                throw new IllegalArgumentException("Unknown email type: " + emailType);
        }
    }
}
