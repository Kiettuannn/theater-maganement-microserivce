import httpClient from "@/configurations/httpClient";
import type { Permission } from "./permissionService";
import {handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

export interface Role {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface RoleRequest {
  name: string;
  description: string;
  permissions: string[]; // Array of permission names
}


// Get all roles
export const getAllRoles = async (): Promise<Role[]> => {
  return handleApiResponse<Role[]>(
    httpClient.get<ApiResponse<Role[]>>("/identity/roles")
  );
};

// Create role
export const createRole = async (request: RoleRequest): Promise<Role> => {
  return handleApiResponse<Role>(
    httpClient.post<ApiResponse<Role>>("/identity/roles", request)
  );
};

// Update role
export const updateRole = async (
  roleId: string,
  request: RoleRequest
): Promise<Role> => {
  const response = await httpClient.put<ApiResponse<Role>>(
    `/identity/roles/${roleId}`,
    request
  );
  return response.data.result;
};

// Delete role
export const deleteRole = async (roleId: string): Promise<void> => {
  await httpClient.delete(`/identity/roles/${roleId}`);
};
