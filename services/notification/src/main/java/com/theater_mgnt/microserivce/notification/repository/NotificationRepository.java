package com.theater_mgnt.microserivce.notification.repository;

import com.theater_mgnt.microserivce.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
}
