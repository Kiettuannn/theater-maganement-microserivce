package com.theater_mgnt.microserivce.notification.service;


import com.theater_mgnt.microserivce.notification.dto.request.EmailRequest;
import com.theater_mgnt.microserivce.notification.dto.request.SendEmailRequest;
import com.theater_mgnt.microserivce.notification.dto.request.Sender;
import com.theater_mgnt.microserivce.notification.dto.response.EmailResponse;
import com.theater_mgnt.microserivce.notification.exception.AppException;
import com.theater_mgnt.microserivce.notification.exception.ErrorCode;
import com.theater_mgnt.microserivce.notification.repository.httpClient.EmailClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class EmailService {
    EmailClient emailClient;

    String apiKey = "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";


    public EmailResponse sendEmail(SendEmailRequest request){
        EmailRequest emailRequest = EmailRequest.builder()
                .sender(Sender.builder()
                        .name("KietKoLat")
                        .email("theonlytruth25012005@gmail.com")
                        .build())
                .to(List.of(request.getTo()))
                .subject(request.getSubject())
                .htmlContent(request.getHtmlContent())
                .build();
        try{
            return emailClient.sendEmail(apiKey, emailRequest);
        }catch (Exception e){
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }
}
