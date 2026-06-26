package com.theater_mgnt.microserivce.notification.repository;

import com.theater_mgnt.microserivce.notification.entity.NotificationPreference;
import com.theater_mgnt.microserivce.notification.enums.NotificationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, String> {
    Optional<NotificationPreference> findByRecipientIdAndChannelNameAndCategoryAndDeletedFalse(String recipientId, String channelName, NotificationCategory category);
}
