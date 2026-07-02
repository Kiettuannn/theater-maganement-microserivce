package com.theater_mgnt.microserivce.notification.service;

import com.theater_mgnt.microserivce.notification.entity.Notification;
import com.theater_mgnt.microserivce.notification.entity.NotificationLog;
import com.theater_mgnt.microserivce.notification.provider.NotificationChannelProvider;
import com.theater_mgnt.microserivce.notification.repository.NotificationLogRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationDispatcher {

    Map<String, NotificationChannelProvider> providers;
    NotificationLogRepository notificationLogRepository;

    public NotificationDispatcher(List<NotificationChannelProvider> providerList, NotificationLogRepository notificationLogRepository) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(NotificationChannelProvider::getChannelName, p -> p));
        this.notificationLogRepository = notificationLogRepository;
    }

    @Async
    public void dispatch(Notification notification, List<String> channels) {
        for (String channelName : channels) {
            NotificationChannelProvider provider = providers.get(channelName);
            if (provider != null) {
                // In full implementation, check NotificationPreference here before sending
                NotificationLog log = provider.send(notification);
                notificationLogRepository.save(log);
            }
        }
    }
}
