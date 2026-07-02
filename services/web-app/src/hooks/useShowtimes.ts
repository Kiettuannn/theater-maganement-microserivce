import { useState, useEffect } from "react";
import { getShowtimesByMovie, type Showtime } from "../services/showtime";

export const useShowtimesByMovie = (movieId: string | undefined) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getShowtimesByMovie(movieId)
      .then(setShowtimes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [movieId]);

  return { showtimes, loading, error };
};
