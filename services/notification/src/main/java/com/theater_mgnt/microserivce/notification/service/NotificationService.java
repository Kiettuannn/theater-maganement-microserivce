package com.theater_mgnt.microserivce.notification.service;

import com.theater_mgnt.microserivce.notification.entity.Notification;
import com.theater_mgnt.microserivce.notification.enums.NotificationStatus;
import com.theater_mgnt.microserivce.notification.enums.Priority;
import com.theater_mgnt.microserivce.notification.enums.RecipientType;
import com.theater_mgnt.microserivce.notification.repository.NotificationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {

    NotificationRepository notificationRepository;
    NotificationDispatcher notificationDispatcher;

    @Transactional
    public void createAndSend(String recipientId, RecipientType recipientType, Map<String, Object> metadata, List<String> channels) {
        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setRecipientType(recipientType);
        notification.setMetadata(metadata);
        notification.setPriority(Priority.NORMAL);
        notification.setStatus(NotificationStatus.PENDING);

        notification = notificationRepository.save(notification);

        notificationDispatcher.dispatch(notification, channels);
        
        // In reality, status should be updated based on dispatcher outcome (which is async, so might need a callback or another way)
        notification.setStatus(NotificationStatus.SENT);
        notificationRepository.save(notification);
    }
}
