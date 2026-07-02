import httpClient from "../configurations/httpClient";
import { handleApiResponse } from "../utils/apiResponse";

export interface SeatStatus {
  seatReservationId: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatName: string;
  seatType: string;
  price: number;
  status: "AVAILABLE" | "LOCKED" | "CONFIRMED" | "CANCELLED";
}

export const getSeatReservations = (showtimeId: string) =>
  handleApiResponse<SeatStatus[]>(httpClient.get(`booking/seat-reservations/${showtimeId}`));
