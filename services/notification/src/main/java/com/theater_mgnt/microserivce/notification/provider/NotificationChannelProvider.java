package com.theater_mgnt.microserivce.notification.provider;

import com.theater_mgnt.microserivce.notification.entity.Notification;
import com.theater_mgnt.microserivce.notification.entity.NotificationLog;

public interface NotificationChannelProvider {
    String getChannelName();
    NotificationLog send(Notification notification);
}
