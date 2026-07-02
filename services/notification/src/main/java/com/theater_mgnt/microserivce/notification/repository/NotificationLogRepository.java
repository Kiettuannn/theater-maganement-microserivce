package com.theater_mgnt.microserivce.notification.repository;

import com.theater_mgnt.microserivce.notification.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, String> {
}
