import httpClient from "@/configurations/httpClient";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";
import type {
  MovieReview,
  CreateReviewRequest,
  UpdateReviewRequest,
  MovieRatingStats,
  PaginatedReviews,
} from "@/types/review";

const BASE_URL = "/reviews";

// ============ CREATE ============
export const createReview = async (
  request: CreateReviewRequest
): Promise<MovieReview> => {
  return handleApiResponse<MovieReview>(
    httpClient.post<ApiResponse<MovieReview>>(BASE_URL, request)
  );
};

// ============ READ ============
export const getReviewById = async (reviewId: string): Promise<MovieReview> => {
  return handleApiResponse<MovieReview>(
    httpClient.get<ApiResponse<MovieReview>>(`${BASE_URL}/${reviewId}`)
  );
};

export const getReviewsByMovieId = async (
  movieId: string
): Promise<MovieReview[]> => {
  return handleApiResponse<MovieReview[]>(
    httpClient.get<ApiResponse<MovieReview[]>>(`${BASE_URL}/movie/${movieId}`)
  );
};

export const getReviewsByMovieIdPaginated = async (
  movieId: string,
  page: number = 0,
  size: number = 10
): Promise<PaginatedReviews> => {
  return handleApiResponse<PaginatedReviews>(
    httpClient.get<ApiResponse<PaginatedReviews>>(
      `${BASE_URL}/movie/${movieId}/paginated`,
      {
        params: { page, size },
      }
    )
  );
};

export const getMostHelpfulReviews = async (
  movieId: string,
  page: number = 0,
  size: number = 5
): Promise<PaginatedReviews> => {
  return handleApiResponse<PaginatedReviews>(
    httpClient.get<ApiResponse<PaginatedReviews>>(
      `${BASE_URL}/movie/${movieId}/most-helpful`,
      {
        params: { page, size },
      }
    )
  );
};

export const getRecentReviews = async (
  movieId: string,
  page: number = 0,
  size: number = 5
): Promise<PaginatedReviews> => {
  return handleApiResponse<PaginatedReviews>(
    httpClient.get<ApiResponse<PaginatedReviews>>(
      `${BASE_URL}/movie/${movieId}/recent`,
      {
        params: { page, size },
      }
    )
  );
};

export const getReviewsByCustomerId = async (
  customerId: string
): Promise<MovieReview[]> => {
  return handleApiResponse<MovieReview[]>(
    httpClient.get<ApiResponse<MovieReview[]>>(
      `${BASE_URL}/customer/${customerId}`
    )
  );
};

export const getMovieRatingStats = async (
  movieId: string
): Promise<MovieRatingStats> => {
  return handleApiResponse<MovieRatingStats>(
    httpClient.get<ApiResponse<MovieRatingStats>>(
      `${BASE_URL}/movie/${movieId}/stats`
    )
  );
};

// ============ UPDATE ============
export const updateReview = async (
  reviewId: string,
  request: UpdateReviewRequest
): Promise<MovieReview> => {
  return handleApiResponse<MovieReview>(
    httpClient.put<ApiResponse<MovieReview>>(
      `${BASE_URL}/${reviewId}`,
      request
    )
  );
};

export const markReviewAsHelpful = async (
  reviewId: string
): Promise<MovieReview> => {
  return handleApiResponse<MovieReview>(
    httpClient.patch<ApiResponse<MovieReview>>(
      `${BASE_URL}/${reviewId}/helpful`
    )
  );
};

export const markReviewAsUnhelpful = async (
  reviewId: string
): Promise<MovieReview> => {
  return handleApiResponse<MovieReview>(
    httpClient.patch<ApiResponse<MovieReview>>(
      `${BASE_URL}/${reviewId}/unhelpful`
    )
  );
};

// ============ DELETE ============
export const deleteReview = async (reviewId: string): Promise<void> => {
  return handleApiResponse<void>(
    httpClient.delete<ApiResponse<void>>(`${BASE_URL}/${reviewId}`)
  );
};
