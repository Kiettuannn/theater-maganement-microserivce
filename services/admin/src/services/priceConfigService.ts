import httpClient from "@/configurations/httpClient";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";
import type {
  PriceConfig,
  PriceConfigRequest,
} from "@/types/PriceConfigType/priceConfig";

// Get all price configs
export const getAllPriceConfigs = async (): Promise<PriceConfig[]> => {
  return handleApiResponse<PriceConfig[]>(
    httpClient.get<ApiResponse<PriceConfig[]>>("/catalog/price-configs")
  );
};

// Create or update price config
export const createPriceConfig = async (
  request: PriceConfigRequest
): Promise<PriceConfig> => {
  return handleApiResponse<PriceConfig>(
    httpClient.post<ApiResponse<PriceConfig>>("/catalog/price-configs", request)
  );
};

// Update price config
export const updatePriceConfig = async (
  id: string,
  request: PriceConfigRequest
): Promise<PriceConfig> => {
  return handleApiResponse<PriceConfig>(
    httpClient.put<ApiResponse<PriceConfig>>(`/catalog/price-configs/${id}`, request)
  );
};

// Delete price config
export const deletePriceConfig = async (id: string): Promise<void> => {
  await httpClient.delete(`/catalog/price-configs/${id}`);
};
