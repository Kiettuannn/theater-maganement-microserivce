import httpClient from "@/configurations/httpClient";
import type { ApiResponse } from "@/utils/apiResponse";

export interface ShowtimeResponse {
  id: string;
  movieId: string;
  movieName: string;
  roomId: string;
  roomName: string;
  cinemaId: string;
  cinemaName: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED";
  totalSeats?: number;      // Tổng số ghế
  bookedSeats?: number;     // Số ghế đã đặt
  availableSeats?: number;  // Số ghế còn trống
}

export interface ShowtimeDetailResponse {
  id: string;
  movieId: string;
  movieName: string;
  roomId: string;
  roomName: string;
  cinemaId: string;
  cinemaName: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED";
  totalSeats: number;       // Tổng số ghế
  bookedSeats: number;      // Số ghế đã đặt
  availableSeats: number;   // Số ghế còn trống
}

export interface CreateShowtimeRequest {
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

export interface UpdateShowtimeRequest {
  roomId: string;
  movieId: string;
  startTime: string;
  endTime: string;
}

// catalog-service: controller @RequestMapping("/showtimes"), qua gateway: /catalog/showtimes
const BASE_URL = "/catalog/showtimes";

// Get all showtimes
export const getAllShowtimes = async (): Promise<ShowtimeResponse[]> => {
  const response = await httpClient.get<ApiResponse<ShowtimeResponse[]>>(BASE_URL);
  return response.data.result || [];
};

// Get showtimes by movie
export const getShowtimesByMovie = async (movieId: string): Promise<ShowtimeResponse[]> => {
  const response = await httpClient.get<ApiResponse<ShowtimeResponse[]>>(`${BASE_URL}/movie/${movieId}`);
  return response.data.result || [];
};

// Get showtimes by room
export const getShowtimesByRoom = async (roomId: string): Promise<ShowtimeResponse[]> => {
  const response = await httpClient.get<ApiResponse<ShowtimeResponse[]>>(`${BASE_URL}/room/${roomId}`);
  return response.data.result || [];
};

// Get showtime by ID
export const getShowtimeById = async (id: string): Promise<ShowtimeResponse> => {
  const response = await httpClient.get<ApiResponse<ShowtimeResponse>>(`${BASE_URL}/${id}`);
  return response.data.result;
};

// Get showtime detail by ID (with ticket information)
export const getShowtimeDetail = async (id: string): Promise<ShowtimeDetailResponse> => {
  const response = await httpClient.get<ApiResponse<ShowtimeDetailResponse>>(`${BASE_URL}/${id}/detail`);
  return response.data.result;
};

// Create showtime
export const createShowtime = async (data: CreateShowtimeRequest): Promise<ShowtimeResponse> => {
  const response = await httpClient.post<ApiResponse<ShowtimeResponse>>(BASE_URL, data);
  return response.data.result;
};

// Update showtime
export const updateShowtime = async (id: string, data: UpdateShowtimeRequest): Promise<ShowtimeResponse> => {
  const response = await httpClient.put<ApiResponse<ShowtimeResponse>>(`${BASE_URL}/${id}`, data);
  return response.data.result;
};

// Delete showtime
export const deleteShowtime = async (id: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${id}`);
};

