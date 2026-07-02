import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { handleApiResponse } from "../utils/apiResponse";

export interface Showtime {
  id: string;
  movieId: string;
  movieName: string;
  roomId: string;
  roomName: string;
  startTime: string;
  endTime: string;
  status: string;
}

export const getShowtimesByMovie = (movieId: string) =>
  handleApiResponse<Showtime[]>(httpClient.get(API.SHOWTIMES_BY_MOVIE(movieId)));
