import httpClient from "@/configurations/httpClient";
import type { SeatType } from "@/types/SeatType/seat";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";


// Get all seat types
export const getAllSeatTypes = async (): Promise<SeatType[]> => {
  return handleApiResponse<SeatType[]>(
    httpClient.get<ApiResponse<SeatType[]>>("/catalog/seatTypes")
  )
}

// Update seat type
export const updateSeatType = async (
  id: string,
  data: { typeName: string; basePriceModifier: number }
): Promise<SeatType> => {
  return handleApiResponse<SeatType>(
    httpClient.put<ApiResponse<SeatType>>(`/catalog/seatTypes/${id}`, data)
  );
};
