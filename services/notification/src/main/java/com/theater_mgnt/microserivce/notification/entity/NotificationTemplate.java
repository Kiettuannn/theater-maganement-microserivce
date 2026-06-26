package com.theater_mgnt.microserivce.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "notification_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationTemplate extends BaseEntity {

    @Column(name = "template_code", unique = true, nullable = false)
    String templateCode;

    @Column(name = "title_template", nullable = false)
    String titleTemplate;

    @Column(name = "content_template", columnDefinition = "TEXT", nullable = false)
    String contentTemplate;
}
