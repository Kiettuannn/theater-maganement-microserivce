import httpClient from "@/configurations/httpClient";
import type { AgeRating } from "@/types/MovieType/Movie";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

const BASE_URL = "/catalog/age_ratings";

export const getAllAgeRatings = async (): Promise<AgeRating[]> => {
  return handleApiResponse<AgeRating[]>(
    httpClient.get<ApiResponse<AgeRating[]>>(BASE_URL)
  );
};

export const getAgeRatingById = async (ageRatingId: string): Promise<AgeRating> => {
  return handleApiResponse<AgeRating>(
    httpClient.get<ApiResponse<AgeRating>>(`${BASE_URL}/${ageRatingId}`)
  );
};

export const createAgeRating = async (
  data: { id: string; code: string; description: string }
): Promise<AgeRating> => {
  return handleApiResponse<AgeRating>(
    httpClient.post<ApiResponse<AgeRating>>(BASE_URL, data)
  );
};

export const updateAgeRating = async (
  ageRatingId: string,
  code: string,
  description: string
): Promise<AgeRating> => {
  return handleApiResponse<AgeRating>(
    httpClient.put<ApiResponse<AgeRating>>(`${BASE_URL}/${ageRatingId}`, {
      code,
      description,
    })
  );
};

export const getMoviesUsingAgeRating = async (ageRatingId: string): Promise<any[]> => {
  return handleApiResponse<any[]>(
    httpClient.get<ApiResponse<any[]>>(`${BASE_URL}/${ageRatingId}/movies`)
  );
};

export const deleteAgeRating = async (ageRatingId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${ageRatingId}`);
};
