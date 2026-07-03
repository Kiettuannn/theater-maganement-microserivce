import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MovieTable } from "@/components/movies/MovieTable";
import { GenreManager } from "@/components/movies/GenreManager";
import { useMovieManager } from "@/hooks/useMovieManager";
import type { MovieSimple } from "@/types/MovieType/Movie";
import { Search, X, Film, Settings } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export function MovieList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMovies, setFilteredMovies] = useState<MovieSimple[]>([]);
  const [genreManagerOpen, setGenreManagerOpen] = useState(false);

  const {
    movies,
    loading,
    confirmDialog,
    loadData,
    handleDeleteMovie,
    closeConfirmDialog,
  } = useMovieManager();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter movies based on search query (client-side filtering)
  useEffect(() => {
    if (!Array.isArray(movies)) {
      setFilteredMovies([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredMovies(movies);
    } else {
      const filtered = movies.filter((movie) => {
        try {
          if (!movie) return false;

          const title = (movie.title || "").toLowerCase();
          const director = (movie.director || "").toLowerCase();
          const query = searchQuery.toLowerCase();

          return title.includes(query) || director.includes(query);
        } catch (error) {
          console.error("Error filtering movie:", movie, error);
          return false;
        }
      });
      setFilteredMovies(filtered);
    }
  }, [movies, searchQuery]);

  const handleOpenCreateDialog = () => {
    navigate(ROUTES.MOVIES_CREATE);
  };

  const handleOpenEditDialog = (movie: MovieSimple) => {
    navigate(ROUTES.MOVIES_EDIT.replace(":id", movie.id));
  };

  const handleDelete = (movie: MovieSimple) => {
    handleDeleteMovie(movie.id, movie.title);
  };

  if (loading) {
    return <LoadingSpinner message="Loading movies..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Movies Management"
          description="Manage all movies in the system"
        />
        <Button
          variant="outline"
          onClick={() => setGenreManagerOpen(true)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage Genres & Ratings
        </Button>
      </div>

      {/* Search and Actions Bar */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search by movie title or director..."
        totalCount={movies.length}
        filteredCount={filteredMovies.length}
        icon={<Film className="w-4 h-4" />}
        label="movies"
        buttonText="Add Movie"
        onAddClick={handleOpenCreateDialog}
      />

      {/* Movie Table */}
      {searchQuery.trim() && filteredMovies.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No movies found
          </h3>
          <p className="text-muted-foreground mb-4">
            No movies match your search for "{searchQuery}"
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
        <MovieTable
          movies={filteredMovies}
          isLoading={loading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDelete}
        />
      )}

      {/* Genre Manager Dialog */}
      <GenreManager
        isOpen={genreManagerOpen}
        onClose={() => setGenreManagerOpen(false)}
        onUpdate={loadData}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText || "Confirm"}
        cancelText="Cancel"
        variant={confirmDialog.variant || "destructive"}
      />
    </div>
  );
}
