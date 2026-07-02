package com.theater_mgnt.microserivce.notification.repository;

import com.theater_mgnt.microserivce.notification.entity.NotificationChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationChannelRepository extends JpaRepository<NotificationChannel, String> {
    Optional<NotificationChannel> findByNameAndDeletedFalse(String name);
}
