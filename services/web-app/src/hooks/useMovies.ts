import { useState, useEffect } from "react";
import {
  getNowShowingMovies,
  getComingSoonMovies,
  getMovieById,
  type MovieSimple,
  type Movie,
} from "../services/movie";

export const useNowShowingMovies = () => {
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNowShowingMovies()
      .then(setMovies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { movies, loading, error };
};

export const useComingSoonMovies = () => {
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getComingSoonMovies()
      .then(setMovies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { movies, loading, error };
};

export const useMovieDetail = (id: string | undefined) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getMovieById(id)
      .then(setMovie)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { movie, loading, error };
};
