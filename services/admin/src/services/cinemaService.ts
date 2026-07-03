import type { Cinema, CreateCinemaRequest, UpdateCinemaRequest } from "@/types/CinemaType/cinemaType";

// DISABLED: /cinemas endpoint đã bị loại bỏ trong microservice.
// Các stub dưới đây giữ nguyên interface để build không lỗi.

// Re-export types for convenience
export type { Cinema, CreateCinemaRequest, UpdateCinemaRequest };

const _warn = (fn: string) => console.warn(`[DISABLED] cinemaService.${fn} — endpoint removed in microservice`);

export const getAllCinemas = async (): Promise<Cinema[]> => { _warn("getAllCinemas"); return []; };
export const getCinemaById = async (_cinemaId: string): Promise<Cinema> => { _warn("getCinemaById"); return {} as Cinema; };
export const createCinema = async (_data: CreateCinemaRequest): Promise<Cinema> => { _warn("createCinema"); return {} as Cinema; };
export const updateCinema = async (_cinemaId: string, _data: UpdateCinemaRequest): Promise<Cinema> => { _warn("updateCinema"); return {} as Cinema; };
export const deleteCinema = async (_cinemaId: string): Promise<void> => { _warn("deleteCinema"); };
export const getCinemasForBufferManagement = async (): Promise<Cinema[]> => { _warn("getCinemasForBufferManagement"); return []; };
export const updateCinemaBuffer = async (_cinemaId: string, _buffer: number | null): Promise<Cinema> => { _warn("updateCinemaBuffer"); return {} as Cinema; };


// // Get all cinemas
// export const getAllCinemas = async (): Promise<Cinema[]> => {
//   return handleApiResponse<Cinema[]>(
//     httpClient.get<ApiResponse<Cinema[]>>(BASE_URL)
//   );
// };

// // Get cinema by ID
// export const getCinemaById = async (cinemaId: string): Promise<Cinema> => {
//   return handleApiResponse<Cinema>(
//     httpClient.get<ApiResponse<Cinema>>(`${BASE_URL}/${cinemaId}`)
//   );
// };

// // Create a new cinema
// export const createCinema = async (data: CreateCinemaRequest): Promise<Cinema> => {
//   return handleApiResponse<Cinema>(
//     httpClient.post<ApiResponse<Cinema>>(BASE_URL, data)
//   );
// };

// // Update cinema by ID
// export const updateCinema = async (
//   cinemaId: string,
//   data: UpdateCinemaRequest
// ): Promise<Cinema> => {
//   return handleApiResponse<Cinema>(
//     httpClient.put<ApiResponse<Cinema>>(`${BASE_URL}/${cinemaId}`, data)
//   );
// };

// // Delete cinema by ID
// export const deleteCinema = async (cinemaId: string): Promise<void> => {
//   await httpClient.delete(`${BASE_URL}/${cinemaId}`);
// };

// // Get cinemas for buffer management (role-based)
// export const getCinemasForBufferManagement = async (): Promise<Cinema[]> => {
//   return handleApiResponse<Cinema[]>(
//     httpClient.get<ApiResponse<Cinema[]>>(`${BASE_URL}/buffer-management`)
//   );
// };

// // Update cinema buffer
// export const updateCinemaBuffer = async (
//   cinemaId: string,
//   buffer: number | null
// ): Promise<Cinema> => {
//   return handleApiResponse<Cinema>(
//     httpClient.patch<ApiResponse<Cinema>>(
//       `${BASE_URL}/${cinemaId}/buffer`,
//       null,
//       { params: { buffer } }
//     )
//   );
// };