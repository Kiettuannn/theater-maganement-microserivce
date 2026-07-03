import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { handleApiResponse } from "../utils/apiResponse";

export interface SeatReservation {
  seatReservationId: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatName: string;
  seatType: string;
  price: number;
  status: "AVAILABLE" | "LOCKED" | "CONFIRMED" | "CANCELLED";
}

export const getSeatsByShowtime = (showtimeId: string) =>
  handleApiResponse<SeatReservation[]>(
    httpClient.get(API.SEAT_RESERVATIONS_BY_SHOWTIME(showtimeId))
  );

export const getAvailableSeatsByShowtime = (showtimeId: string) =>
  handleApiResponse<SeatReservation[]>(
    httpClient.get(API.AVAILABLE_SEATS, {
      params: { showtimeId, status: "AVAILABLE" },
    })
  );

export interface CreateBookingRequest {
  userId: string;
  showtimeId: string;
  seatReservationIds: string[];
  idempotencyKey: string;
  currency: string;
}

export interface BookingResponse {
  id: string;
  bookingCode: string;
  status: string;
  totalAmount: number;
  currency: string;
  expiresAt: string;
}

export const createBooking = (request: CreateBookingRequest) =>
  handleApiResponse<BookingResponse>(
    httpClient.post(API.CREATE_BOOKING, request)
  );

export const confirmBooking = (bookingId: string, contactEmail?: string, contactPhone?: string) =>
  handleApiResponse<any>(
    httpClient.post(API.CONFIRM_BOOKING(bookingId), { contactEmail, contactPhone })
  );

export const cancelBooking = (bookingId: string) =>
  handleApiResponse<any>(
    httpClient.post(API.CANCEL_BOOKING(bookingId))
  );

export interface SeatSummary {
  seatName: string;
  price: number;
}

export interface BookingSummary {
  id: string;
  status: string;
  totalAmount: number;
  expiresAt: string;
  seats?: SeatSummary[];
}

export const getBookingSummary = (bookingId: string) =>
  handleApiResponse<BookingSummary>(
    httpClient.get(API.BOOKING_SUMMARY(bookingId))
  );

export interface Ticket {
  id: string;
  ticketCode: string;
  bookingId: string;
  showtimeId: string;
  seatId: string;
  seatName?: string;
  price: number;
  status: string;
  movieTitle?: string;
  roomName?: string;
  showDate?: string;
  showTime?: string;
}

export const getTicketsByBooking = (bookingId: string) =>
  handleApiResponse<Ticket[]>(
    httpClient.get(API.TICKETS_BY_BOOKING(bookingId))
  );

export interface BookingListItem {
  id: string;
  bookingCode: string;
  userId: string;
  showtimeId: string;
  seatCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export interface BookingListResponse {
  bookings: BookingListItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const getMyBookings = (userId: string, page: number = 0, size: number = 10) =>
  handleApiResponse<BookingListResponse>(
    httpClient.get(API.GET_BOOKINGS, { params: { userId, page, size } })
  );
