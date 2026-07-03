import httpClient from "@/configurations/httpClient";
import { handleApiResponse, type ApiResponse } from "@/utils/apiResponse";

export interface Permission {
  name: string;
  description: string;
}

export interface PermissionRequest {
  name: string;
  description: string;
}


// Get all permissions
export const getAllPermissions = async (): Promise<Permission[]> => {
  return handleApiResponse<Permission[]>(
    httpClient.get<ApiResponse<Permission[]>>("/identity/permissions")
  );
};

// Create permission
export const createPermission = async (
  request: PermissionRequest
): Promise<Permission> => {
  return handleApiResponse<Permission>(
    httpClient.post<ApiResponse<Permission>>("/identity/permissions", request)
  );
};

// Delete permission
export const deletePermission = async (permissionId: string): Promise<void> => {
  await httpClient.delete(`/identity/permissions/${permissionId}`);
};
