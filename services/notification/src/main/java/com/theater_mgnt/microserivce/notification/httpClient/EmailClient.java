package com.theater_mgnt.microserivce.notification.httpClient;

import com.theater_mgnt.microserivce.notification.dto.EmailRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "email-client", url = "https://api.brevo.com")
public interface EmailClient {

    @PostMapping(value = "/v3/smtp/email", produces = "application/json", consumes = "application/json")
    Object sendEmail(@RequestHeader("api-key") String apiKey, @RequestBody EmailRequest body);
}
