import httpClient from "@/configurations/httpClient";
import type { Genre } from "@/types/MovieType/Movie";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

const BASE_URL = "/catalog/genres";

export const getAllGenres = async (): Promise<Genre[]> => {
  return handleApiResponse<Genre[]>(
    httpClient.get<ApiResponse<Genre[]>>(BASE_URL)
  );
};

export const getGenreById = async (genreId: string): Promise<Genre> => {
  return handleApiResponse<Genre>(
    httpClient.get<ApiResponse<Genre>>(`${BASE_URL}/${genreId}`)
  );
};

export const createGenre = async (data: { id: string; name: string }): Promise<Genre> => {
  return handleApiResponse<Genre>(
    httpClient.post<ApiResponse<Genre>>(BASE_URL, data)
  );
};

export const updateGenre = async (
  genreId: string,
  name: string
): Promise<Genre> => {
  return handleApiResponse<Genre>(
    httpClient.put<ApiResponse<Genre>>(`${BASE_URL}/${genreId}`, { name })
  );
};

export const getMoviesUsingGenre = async (genreId: string): Promise<any[]> => {
  return handleApiResponse<any[]>(
    httpClient.get<ApiResponse<any[]>>(`${BASE_URL}/${genreId}/movies`)
  );
};

export const deleteGenre = async (genreId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${genreId}`);
};
