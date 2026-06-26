package com.theater_mgnt.microserivce.notification.repository;

import com.theater_mgnt.microserivce.notification.entity.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, String> {
    Optional<NotificationTemplate> findByTemplateCodeAndDeletedFalse(String templateCode);
}
