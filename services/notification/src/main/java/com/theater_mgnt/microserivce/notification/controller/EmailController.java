package com.theater_mgnt.microserivce.notification.controller;

import com.theater_mgnt.microserivce.notification.dto.EmailRequest;
import com.theater_mgnt.microserivce.notification.service.EmailService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EmailController {
    EmailService emailService;

    @PostMapping("/email/send")
    public String sendEmail(@RequestBody EmailRequest request){
        emailService.sendEmail(request);
        return "OK";
    }
}
