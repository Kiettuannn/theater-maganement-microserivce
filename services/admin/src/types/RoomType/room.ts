import type { Seat} from "../SeatType/seat";

export const RoomStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  MAINTENANCE: "MAINTENANCE",
} as const;
export type RoomStatus = typeof RoomStatus[keyof typeof RoomStatus];

export const RoomType = {
  STANDARD: "STANDARD",
  IMAX: "IMAX",
  FOUR_DX :"FOUR_DX",
  GOLD_CLASS :"GOLD_CLASS",
} as const;
export type RoomType = typeof RoomType[keyof typeof RoomType];


export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  currentMovie?: string;
  nextShowtime?: string;

  roomType: RoomType;
  totalSeats: number;
  cinemaId: string;
  cinemaName: string;
  seats?: Seat[];
}


export interface CreateRoomRequest {
  name: string;
  roomType: RoomType;
  status: RoomStatus;
  // Omit: Eliminate id and available when sending to backend
  seats: Omit<Seat, 'id' | 'available'>[]; 
}

export interface UpdateRoomRequest {
  name: string;
  roomType: RoomType;
  status: RoomStatus;

  // Omit: Eliminate id and available when sending to backend
  seats: Omit<Seat, 'id' | 'available'>[]; 
}


