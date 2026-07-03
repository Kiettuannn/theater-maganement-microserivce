package com.theater_mgnt.microserivce.notification.httpClient;

import com.theater_mgnt.microserivce.notification.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", url = "${services.identity.url:http://localhost:8081}")
public interface IdentityClient {

    @GetMapping("/identity/internal/users/{userId}")
    UserResponse getUser(@PathVariable String userId);
}
