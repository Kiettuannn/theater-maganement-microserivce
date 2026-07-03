import httpClient from "@/configurations/httpClient";
import type { CreateRoomRequest, Room, UpdateRoomRequest } from "@/types/RoomType/room";
import {  handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

// Re-export types for convenience
export type { Room, CreateRoomRequest, UpdateRoomRequest };

const BASE_URL = "/catalog/rooms";

// Get all rooms
export const getAllRooms = async () : Promise<Room[]> => {
  return handleApiResponse<Room[]>(
    httpClient.get<ApiResponse<Room[]>>(BASE_URL)
  )
}

// Create a new room
export const createRoom = async (roomData: CreateRoomRequest): Promise<Room> => {
  return handleApiResponse<Room>(
    httpClient.post<ApiResponse<Room>>(BASE_URL, roomData)
  );
};

// Get a room by id
export const getRoomById = async (id: string) : Promise<Room> => {
  return handleApiResponse<Room>(
    httpClient.get<ApiResponse<Room[]>>(`${BASE_URL}/${id}`)
  )
}

// Update a room by id
export const updateRoom = async (id: string, roomData: UpdateRoomRequest): Promise<Room> => {
  return handleApiResponse<Room>(
    httpClient.put<ApiResponse<Room>>(`${BASE_URL}/${id}`, roomData)
  );
}

export const getRoomsByCinema = async (cinemaId: string) => {
  return await httpClient.get(`${BASE_URL}/cinema/${cinemaId}`);
};

export const deleteRoom = async (roomId: string) => {
  return await httpClient.delete(`${BASE_URL}/${roomId}`);
};