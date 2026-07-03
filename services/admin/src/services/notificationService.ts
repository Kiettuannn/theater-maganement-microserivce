import httpClient from "@/configurations/httpClient";
import type { Notification, NotificationRequest, PaginatedNotificationResponse, NotificationLog } from "@/types/NotificationType/Notification";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

const BASE_URL = "/admin/notifications";

// Re-export types
export type { NotificationRequest };

// Define NotificationLogDetail type with notification title
export interface NotificationLogDetail extends NotificationLog {
  notificationTitle: string;
}

// Admin: Get all notifications
export const getAllNotifications = async (): Promise<Notification[]> => {
  const paginatedResponse = await handleApiResponse<PaginatedNotificationResponse>(
    httpClient.get<ApiResponse<PaginatedNotificationResponse>>(BASE_URL)
  );
  return paginatedResponse.content;
};

// Admin: Get notification detail
export const getNotificationById = async (id: string): Promise<Notification> => {
  return handleApiResponse<Notification>(
    httpClient.get<ApiResponse<Notification>>(`${BASE_URL}/${id}`)
  );
};

// Admin: Get all notification logs (optimized - direct from logs table)
export const getAllNotificationLogs = async (): Promise<NotificationLogDetail[]> => {
  return handleApiResponse<NotificationLogDetail[]>(
    httpClient.get<ApiResponse<NotificationLogDetail[]>>(`${BASE_URL}/logs`)
  );
};

// Admin: Get notification log detail by ID
export const getNotificationLogById = async (id: string): Promise<NotificationLogDetail> => {
  return handleApiResponse<NotificationLogDetail>(
    httpClient.get<ApiResponse<NotificationLogDetail>>(`${BASE_URL}/logs/${id}`)
  );
};

// Admin: Delete notification log
export const deleteNotificationLog = async (id: string): Promise<void> => {
  return handleApiResponse<void>(
    httpClient.delete<ApiResponse<void>>(`${BASE_URL}/logs/${id}`)
  );
};

// Admin: Send notification(s) to one or multiple recipients
export const sendNotification = async (
  request: NotificationRequest
): Promise<Notification[]> => {
  return handleApiResponse<Notification[]>(
    httpClient.post<ApiResponse<Notification[]>>(`${BASE_URL}/send`, request)
  );
};

// Admin: Delete notification
export const deleteNotification = async (id: string): Promise<void> => {
  return handleApiResponse<void>(
    httpClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`)
  );
};

// Admin: Get in-app notifications for current user
export const getInAppNotifications = async (): Promise<Notification[]> => {
  return handleApiResponse<Notification[]>(
    httpClient.get<ApiResponse<Notification[]>>(`${BASE_URL}/in-app`)
  );
};

// Admin: Mark notification as read
export const markNotificationAsRead = async (id: string): Promise<void> => {
  return handleApiResponse<void>(
    httpClient.patch<ApiResponse<void>>(`${BASE_URL}/${id}/read`)
  );
};

// Admin: Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  return handleApiResponse<void>(
    httpClient.patch<ApiResponse<void>>(`${BASE_URL}/read-all`)
  );
};
