import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { handleApiResponse } from "../utils/apiResponse";

export type MovieStatus = "coming_soon" | "now_showing" | "archived";

interface GenreInfo {
  id: string;
  name: string;
}

interface AgeRatingInfo {
  id: string;
  code: string;
  description: string;
}

// Trả về bởi: GET /movies, /now-showing, /coming-soon
export interface MovieSimple {
  id: string;
  title: string;
  slug: string;
  posterUrl: string;
  trailerUrl?: string;
  durationMinutes: number;
  releaseDate: string;
  status: MovieStatus;
  ageRatingCode?: string;
  director?: string;
  genres: GenreInfo[];
  needsArchiveWarning?: boolean;
}

// Trả về bởi: GET /movies/{id}
export interface Movie extends MovieSimple {
  description: string;
  castMembers?: string;
  endDate?: string;
  ageRating?: AgeRatingInfo;
  createdAt?: string;
  updatedAt?: string;
}

export const getMovies = () =>
  handleApiResponse<MovieSimple[]>(httpClient.get(API.MOVIES));

export const getNowShowingMovies = () =>
  handleApiResponse<MovieSimple[]>(httpClient.get(API.MOVIES_NOW_SHOWING));

export const getComingSoonMovies = () =>
  handleApiResponse<MovieSimple[]>(httpClient.get(API.MOVIES_COMING_SOON));

export const getMovieById = (id: string) =>
  handleApiResponse<Movie>(httpClient.get(API.MOVIE_BY_ID(id)));
