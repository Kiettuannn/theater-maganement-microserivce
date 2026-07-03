import httpClient from "@/configurations/httpClient";
import type { NotificationTemplate, NotificationTemplateRequest } from "@/types/NotificationType/Template";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

const BASE_URL = "/admin/notification-templates";

// Re-export types
export type { NotificationTemplate, NotificationTemplateRequest };

// Get all templates
export const getAllTemplates = async (): Promise<NotificationTemplate[]> => {
  return handleApiResponse<NotificationTemplate[]>(
    httpClient.get<ApiResponse<NotificationTemplate[]>>(BASE_URL)
  );
};

// Get template by ID
export const getTemplateById = async (id: string): Promise<NotificationTemplate> => {
  return handleApiResponse<NotificationTemplate>(
    httpClient.get<ApiResponse<NotificationTemplate>>(`${BASE_URL}/${id}`)
  );
};

// Get template by code
export const getTemplateByCode = async (code: string): Promise<NotificationTemplate> => {
  return handleApiResponse<NotificationTemplate>(
    httpClient.get<ApiResponse<NotificationTemplate>>(`${BASE_URL}/code/${code}`)
  );
};

// Create template
export const createTemplate = async (
  request: NotificationTemplateRequest
): Promise<NotificationTemplate> => {
  return handleApiResponse<NotificationTemplate>(
    httpClient.post<ApiResponse<NotificationTemplate>>(BASE_URL, request)
  );
};

// Update template
export const updateTemplate = async (
  id: string,
  request: NotificationTemplateRequest
): Promise<NotificationTemplate> => {
  return handleApiResponse<NotificationTemplate>(
    httpClient.put<ApiResponse<NotificationTemplate>>(`${BASE_URL}/${id}`, request)
  );
};

// Delete template
export const deleteTemplate = async (id: string): Promise<void> => {
  return handleApiResponse<void>(
    httpClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`)
  );
};
