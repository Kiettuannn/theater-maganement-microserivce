package com.theater_mgnt.microserivce.notification.dto.request;

import lombok.experimental.FieldDefaults;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendEmailRequest {
    Recipient to;
    String subject;
    String htmlContent;
}
