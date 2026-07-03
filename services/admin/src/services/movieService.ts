import httpClient from "@/configurations/httpClient";
import type { Movie, MovieSimple, CreateMovieRequest, UpdateMovieRequest } from "@/types/MovieType/Movie";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

export type { Movie, MovieSimple, CreateMovieRequest, UpdateMovieRequest };

const BASE_URL = "/catalog/movies";

export const getAllMovies = async (): Promise<MovieSimple[]> => {
  return handleApiResponse<MovieSimple[]>(
    httpClient.get<ApiResponse<MovieSimple[]>>(BASE_URL)
  );
};

export const getMovieById = async (movieId: string): Promise<Movie> => {
  return handleApiResponse<Movie>(
    httpClient.get<ApiResponse<Movie>>(`${BASE_URL}/${movieId}`)
  );
};

export const createMovie = async (
  request: CreateMovieRequest
): Promise<Movie> => {
  return handleApiResponse<Movie>(
    httpClient.post<ApiResponse<Movie>>(BASE_URL, request)
  );
};

export const updateMovie = async (
  movieId: string,
  request: UpdateMovieRequest
): Promise<Movie> => {
  return handleApiResponse<Movie>(
    httpClient.put<ApiResponse<Movie>>(`${BASE_URL}/${movieId}`, request)
  );
};

export const deleteMovie = async (movieId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${movieId}`);
};

export const searchMovies = async (keyword: string): Promise<MovieSimple[]> => {
  return handleApiResponse<MovieSimple[]>(
    httpClient.get<ApiResponse<MovieSimple[]>>(`${BASE_URL}/search`, {
      params: { title: keyword },
    })
  );
};

export const getMoviesByStatus = async (status: string): Promise<MovieSimple[]> => {
  return handleApiResponse<MovieSimple[]>(
    httpClient.get<ApiResponse<MovieSimple[]>>(`${BASE_URL}/status/${status}`)
  );
};
