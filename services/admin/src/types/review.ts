// Review API Types
export interface MovieReview {
  id: string;
  rating: number;
  comment: string;
  isSpoiler: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  movie: {
    id: string;
    title: string;
    posterUrl: string;
  };
  screening?: {
    id: string;
    startTime: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  customerId: string;
  movieId: string;
  screeningId?: string;
  rating: number;
  comment?: string;
  isSpoiler?: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  isSpoiler?: boolean;
}

export interface MovieRatingStats {
  movieId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
}

export interface PaginatedReviews {
  content: MovieReview[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
