package com.theater_mgnt.microserivce.notification.entity;

import com.theater_mgnt.microserivce.notification.enums.NotificationStatus;
import com.theater_mgnt.microserivce.notification.enums.Priority;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    NotificationTemplate notificationTemplate;

    @Column(name = "recipient_id", nullable = false)
    String recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false)
    RecipientType recipientType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    Map<String, Object> metadata;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    Priority priority = Priority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    NotificationStatus status = NotificationStatus.PENDING;

    @Column(name = "read_at")
    LocalDateTime readAt;
}
