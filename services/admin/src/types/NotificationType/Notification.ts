export type NotificationStatus = "PENDING" | "SENT" | "FAILED";
export type NotificationPriority = "URGENT" | "HIGH" | "NORMAL";
export type NotificationCategory = "BOOKING" | "PROMOTION" | "SYSTEM" | "SECURITY" | "REMINDER";
export type RecipientType = "CUSTOMER" | "STAFF" | "ADMIN";

export interface NotificationLog {
  id: string;
  notificationId: string;
  channelName: string;
  status: string;
  providerResponse: Record<string, any> | null;
  sentAt: string;
}

export interface Notification {
  id: string;
  templateCode: string;
  recipientId: string;
  recipientType: RecipientType;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  content: string;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  logs?: NotificationLog[];
}

export interface NotificationRequest {
  templateCode: string;
  recipientIds: string[]; // Always an array (1 or more recipients)
  recipientType: RecipientType;
  category: NotificationCategory;
  channels: string[];
  metadata: Record<string, any>;
  priority?: NotificationPriority;
}

// Paginated Response
export interface PaginatedNotificationResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
