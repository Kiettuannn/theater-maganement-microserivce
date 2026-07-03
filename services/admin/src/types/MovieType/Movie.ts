export interface AgeRating {
  id: string;
  code: string;
  description: string;
}

export interface Genre {
  id: string;
  name: string;
}

// Simple response for list view
export interface MovieSimple {
  id: string;
  title: string;
  posterUrl: string;
  durationMinutes: number;
  releaseDate: string;
  status: "now_showing" | "coming_soon" | "archived";
  ageRatingCode: string;
  director: string;
  needsArchiveWarning?: boolean;
}

// Full response for detail view
export interface Movie {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  director: string;
  castMembers: string;
  posterUrl: string;
  trailerUrl: string;
  releaseDate: string;
  endDate: string;
  status: "now_showing" | "coming_soon" | "archived";
  ageRating: AgeRating;
  genres: Genre[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMovieRequest {
  title: string;
  description: string;
  durationMinutes: number;
  director: string;
  castMembers: string;
  posterUrl: string;
  trailerUrl: string;
  releaseDate: string;
  endDate: string;
  status: "now_showing" | "coming_soon" | "archived";
  ageRatingId: string;
  genreIds: string[];
}

export interface UpdateMovieRequest {
  title?: string;
  description?: string;
  durationMinutes?: number;
  director?: string;
  castMembers?: string;
  posterUrl?: string;
  trailerUrl?: string;
  releaseDate?: string;
  endDate?: string;
  status?: "now_showing" | "coming_soon" | "archived";
  ageRatingId?: string;
  genreIds?: string[];
}
