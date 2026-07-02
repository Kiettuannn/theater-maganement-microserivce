package com.theater_mgnt.microserivce.notification.provider;

import com.theater_mgnt.microserivce.notification.entity.Notification;
import com.theater_mgnt.microserivce.notification.entity.NotificationLog;
import com.theater_mgnt.microserivce.notification.service.SocketIOService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InAppChannelProvider implements NotificationChannelProvider {

    SocketIOService socketIOService;

    @Override
    public String getChannelName() {
        return "IN_APP";
    }

    @Override
    public NotificationLog send(Notification notification) {
        NotificationLog log = new NotificationLog();
        log.setNotification(notification);
        log.setChannelName(getChannelName());
        log.setSentAt(LocalDateTime.now());

        try {
            socketIOService.emitNotificationToUser(notification.getRecipientId(), notification.getMetadata());
            log.setStatus("SENT");
        } catch (Exception e) {
            log.setStatus("FAILED");
            log.setProviderResponse(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }

        return log;
    }
}
