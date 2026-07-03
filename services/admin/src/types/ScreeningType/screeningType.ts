export const ScreeningStatus = {
  SCHEDULED: "SCHEDULED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
} as const;

export type ScreeningStatus = typeof ScreeningStatus[keyof typeof ScreeningStatus];

export interface Screening {
  id: string;
  movieId: string;
  movieName: string;
  roomId: string;
  roomName: string;
  cinemaId: string;
  cinemaName: string;
  startTime: string;
  endTime: string;
  status: ScreeningStatus;
}

export interface CreateScreeningRequest {
  roomId: string;
  movieId: string;
  startTime: string;
  endTime: string;
}

export interface UpdateScreeningRequest {
  startTime: string;
  endTime: string;
}

export interface ScreeningFilters {
  status?: ScreeningStatus;
  cinemaId?: string;
  roomId?: string;
  searchQuery?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
