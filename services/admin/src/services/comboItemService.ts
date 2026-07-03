import httpClient from "@/configurations/httpClient";
import type { ComboItem, CreateComboItemRequest, UpdateComboItemRequest } from "@/types/ComboType/comboType";
import { handleApiResponse, type ApiResponse } from "@/utils/apiResponse";

const BASE_URL = "/catalog/comboItems";

// Get all combo items
export const getAllComboItems = async (): Promise<ComboItem[]> => {
  return handleApiResponse<ComboItem[]>(
    httpClient.get<ApiResponse<ComboItem[]>>(BASE_URL)
  );
};

// Get combo items by combo ID
export const getComboItemsByComboId = async (comboId: string): Promise<ComboItem[]> => {
  return handleApiResponse<ComboItem[]>(
    httpClient.get<ApiResponse<ComboItem[]>>(`${BASE_URL}/combo/${comboId}`)
  );
};

// Get combo item by ID
export const getComboItemById = async (comboItemId: string): Promise<ComboItem> => {
  return handleApiResponse<ComboItem>(
    httpClient.get<ApiResponse<ComboItem>>(`${BASE_URL}/${comboItemId}`)
  );
};

// Create a new combo item
export const createComboItem = async (data: CreateComboItemRequest): Promise<ComboItem> => {
  return handleApiResponse<ComboItem>(
    httpClient.post<ApiResponse<ComboItem>>(BASE_URL, data)
  );
};

// Update combo item by ID
export const updateComboItem = async (
  comboItemId: string,
  data: UpdateComboItemRequest
): Promise<ComboItem> => {
  return handleApiResponse<ComboItem>(
    httpClient.put<ApiResponse<ComboItem>>(`${BASE_URL}/${comboItemId}`, data)
  );
};

// Delete combo item by ID
export const deleteComboItem = async (comboItemId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${comboItemId}`);
};
