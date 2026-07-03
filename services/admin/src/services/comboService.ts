import httpClient from "@/configurations/httpClient";
import type { Combo, CreateComboRequest, UpdateComboRequest } from "@/types/ComboType/comboType";
import { handleApiResponse, type ApiResponse } from "@/utils/apiResponse";

const BASE_URL = "/catalog/combos";

// Get all combos
export const getAllCombos = async (): Promise<Combo[]> => {
  return handleApiResponse<Combo[]>(
    httpClient.get<ApiResponse<Combo[]>>(BASE_URL)
  );
};

// Get combo by ID
export const getComboById = async (comboId: string): Promise<Combo> => {
  return handleApiResponse<Combo>(
    httpClient.get<ApiResponse<Combo>>(`${BASE_URL}/${comboId}`)
  );
};

// Create a new combo
export const createCombo = async (data: CreateComboRequest): Promise<Combo> => {
  return handleApiResponse<Combo>(
    httpClient.post<ApiResponse<Combo>>(BASE_URL, data)
  );
};

// Update combo by ID
export const updateCombo = async (
  comboId: string,
  data: UpdateComboRequest
): Promise<Combo> => {
  return handleApiResponse<Combo>(
    httpClient.put<ApiResponse<Combo>>(`${BASE_URL}/${comboId}`, data)
  );
};

// Delete combo by ID
export const deleteCombo = async (comboId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${comboId}`);
};
