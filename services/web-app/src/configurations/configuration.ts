export const CONFIG = {
  API: import.meta.env.VITE_API_URL || "http://localhost:8888/api",
  SOCKET: import.meta.env.VITE_SOCKET_URL || "http://localhost:9093",
}
export const API = {
  LOGIN: "identity/auth/token",
  FORGOT_PASSWORD: "identity/auth/forgot-password",
  REGISTER: "identity/users/registration",
  CHECK_USERNAME_AVAILABLE: "identity/users/username/available",
  CHECK_EMAIL_AVAILABLE: "identity/users/email/available",

  MOVIES: "catalog/movies",
  MOVIES_NOW_SHOWING: "catalog/movies/now-showing",
  MOVIES_COMING_SOON: "catalog/movies/coming-soon",
  MOVIE_BY_ID: (id: string) => `catalog/movies/${id}`,
  SHOWTIMES_BY_MOVIE: (id: string) => `catalog/showtimes/movie/${id}`,

  SEAT_RESERVATIONS_BY_SHOWTIME: (showtimeId: string) => `booking/seat-reservations/${showtimeId}`,
  AVAILABLE_SEATS: `booking/seat-reservations`,

  CREATE_BOOKING: "booking/bookings",
  GET_BOOKINGS: "booking/bookings",
  CANCEL_BOOKING: (bookingId: string) => `booking/bookings/${bookingId}/cancel`,
  CONFIRM_BOOKING: (bookingId: string) => `booking/bookings/${bookingId}/confirm`,
  BOOKING_SUMMARY: (bookingId: string) => `booking/bookings/${bookingId}/summary`,
  TICKETS_BY_BOOKING: (bookingId: string) => `booking/tickets/by-booking/${bookingId}`,
}


