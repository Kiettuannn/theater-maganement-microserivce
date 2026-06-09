package com.theater_mgnt.microserivce.event.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationEvent {
    String channel;
    String recipient;
//    String templateCode;
//    Map<String, Object> data
    String subject;
    String body;
}
