package com.theater_mgnt.microserivce.notification.entity;

import com.theater_mgnt.microserivce.notification.enums.NotificationCategory;
import com.theater_mgnt.microserivce.notification.enums.RecipientType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationPreference extends BaseEntity {

    @Column(name = "recipient_id", nullable = false)
    String recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false)
    RecipientType recipientType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    NotificationCategory category;

    @Column(name = "is_enabled", nullable = false)
    Boolean isEnabled = true;
}
