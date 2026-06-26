package com.theater_mgnt.microserivce.notification.dto.event;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerRegisteredEvent {
    String id; // Account ID
    String email;
    String firstName;
    String lastName;
    String rawPassword;
}
