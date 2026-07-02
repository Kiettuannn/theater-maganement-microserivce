export const CONFIG = {
  API: "http://localhost:8888/api",
  // API: `${import.meta.env.VITE_API_URL}/theater-mgnt`,
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
}


