import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { ReviewTable } from "@/components/reviews/ReviewTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Film, X, Search } from "lucide-react";
import { getReviewsByMovieId, deleteReview } from "@/services/reviewService";
import { getAllMovies } from "@/services/movieService";
import type { MovieReview } from "@/types/review";
import type { MovieSimple } from "@/types/MovieType/Movie";
import { toast } from "sonner";

export function ReviewList() {
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<MovieReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    reviewId: "",
    reviewTitle: "",
  });

  // Load movies on mount
  useEffect(() => {
    loadMovies();
  }, []);

  // Load reviews when movie is selected
  useEffect(() => {
    if (selectedMovie) {
      loadReviews(selectedMovie);
    } else {
      setReviews([]);
      setFilteredReviews([]);
    }
  }, [selectedMovie]);

  const loadMovies = async () => {
    try {
      setLoadingMovies(true);
      const data = await getAllMovies();
      setMovies(data);
    } catch (error) {
      console.error("Failed to load movies:", error);
      toast.error("Failed to load movies");
    } finally {
      setLoadingMovies(false);
    }
  };

  const loadReviews = async (movieId: string) => {
    try {
      setLoading(true);
      const data = await getReviewsByMovieId(movieId);
      setReviews(data);
      setFilteredReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      toast.error("Failed to load reviews");
      setReviews([]);
      setFilteredReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter reviews based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReviews(reviews);
    } else {
      const filtered = reviews.filter((review) => {
        const customerName =
          `${review.customer.firstName} ${review.customer.lastName}`.toLowerCase();
        const movieTitle = review.movie.title.toLowerCase();
        const comment = (review.comment || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        return (
          customerName.includes(query) ||
          movieTitle.includes(query) ||
          comment.includes(query)
        );
      });
      setFilteredReviews(filtered);
    }
  }, [reviews, searchQuery]);

  const handleDeleteClick = (review: MovieReview) => {
    setConfirmDialog({
      isOpen: true,
      reviewId: review.id,
      reviewTitle: `Review by ${review.customer.firstName} ${review.customer.lastName} for ${review.movie.title}`,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteReview(confirmDialog.reviewId);
      toast.success("Review deleted successfully");
      if (selectedMovie) {
        loadReviews(selectedMovie);
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    } finally {
      setConfirmDialog({ isOpen: false, reviewId: "", reviewTitle: "" });
    }
  };

  const handleCloseDialog = () => {
    setConfirmDialog({ isOpen: false, reviewId: "", reviewTitle: "" });
  };

  if (loadingMovies) {
    return <LoadingSpinner message="Loading movies..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews Management"
        description="Manage all movie reviews in the system"
      />

      {/* Movie Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMovie} onValueChange={setSelectedMovie}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a movie to view reviews" />
            </SelectTrigger>
            <SelectContent>
              {movies.map((movie) => (
                <SelectItem key={movie.id} value={movie.id}>
                  {movie.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedMovie && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMovie("")}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Search Bar */}
      {selectedMovie && (
        <SearchAddBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search by customer or comment..."
          totalCount={reviews.length}
          filteredCount={filteredReviews.length}
          icon={<MessageSquare className="w-4 h-4" />}
          label="reviews"
          buttonText="Add Review"
          onAddClick={() => {}}
        />
      )}

      {/* Reviews Table */}
      {searchQuery.trim() &&
      filteredReviews.length === 0 &&
      !loading &&
      selectedMovie ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No reviews found
          </h3>
          <p className="text-muted-foreground mb-4">
            No reviews match your search for "{searchQuery}"
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear search
          </Button>
        </div>
      ) : (
        <ReviewTable
          reviews={filteredReviews}
          isLoading={loading}
          onDelete={handleDeleteClick}
          selectedMovie={!!selectedMovie}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Review"
        description={`Are you sure you want to delete this review: "${confirmDialog.reviewTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
