import { useState, useCallback } from "react";
import {
  getAllMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from "@/services/movieService";
import type { MovieSimple, CreateMovieRequest, UpdateMovieRequest } from "@/types/MovieType/Movie";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";

export function useMovieManager() {
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { confirmDialog, showConfirmDialog, closeConfirmDialog } =
    useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load all movies
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const moviesData = await getAllMovies();
      setMovies(moviesData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load movies",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Create new movie
  const handleCreateMovie = useCallback(
    async (request: CreateMovieRequest): Promise<boolean> => {
      try {
        setSaving(true);
        await createMovie(request);
        // Reload the list after creating
        const moviesData = await getAllMovies();
        setMovies(moviesData);
        addNotification({
          type: "success",
          title: "Success",
          message: `Movie "${request.title}" created successfully`,
        });
        return true;
      } catch (error: any) {
        // Get detailed error message from backend
        const backendMessage = error?.response?.data?.message;
        const statusCode = error?.response?.status;
        const backendData = error?.response?.data;

        let errorMessage = "Failed to create movie";

        if (statusCode === 400) {
          errorMessage = backendMessage || "Invalid data. Please check all fields and try again.";
        } else if (statusCode === 404) {
          errorMessage = backendMessage || "Age rating or genre not found.";
        } else if (backendMessage) {
          errorMessage = backendMessage;
        }

        // Enhanced logging for debugging
        console.group("❌ Movie Creation Error");
        console.log("Status Code:", statusCode);
        console.log("Backend Message:", backendMessage);
        console.log("Full Error Response:", JSON.stringify(backendData, null, 2));
        console.log("Request Data:", error?.config?.data);
        console.groupEnd();

        addNotification({
          type: "error",
          title: "Error",
          message: errorMessage,
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Update movie
  const handleUpdateMovie = useCallback(
    async (movieId: string, request: UpdateMovieRequest): Promise<boolean> => {
      try {
        setSaving(true);
        await updateMovie(movieId, request);
        // Reload the list after updating
        const moviesData = await getAllMovies();
        setMovies(moviesData);
        addNotification({
          type: "success",
          title: "Success",
          message: "Movie updated successfully",
        });
        return true;
      } catch (error: any) {
        const backendMessage = error?.response?.data?.message;
        const statusCode = error?.response?.status;

        let errorMessage = "Failed to update movie";

        if (statusCode === 400) {
          errorMessage = backendMessage || "Invalid data. Please check all fields and try again.";
        } else if (statusCode === 404) {
          errorMessage = backendMessage || "Movie, age rating, or genre not found.";
        } else if (backendMessage) {
          errorMessage = backendMessage;
        }

        console.error("Movie update error:", {
          status: statusCode,
          message: backendMessage,
          data: error?.response?.data,
        });

        addNotification({
          type: "error",
          title: "Error",
          message: errorMessage,
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Delete movie
  const handleDeleteMovie = useCallback(
    async (movieId: string, movieTitle: string): Promise<void> => {
      showConfirmDialog({
        title: "Delete Movie",
        description: `Are you sure you want to delete movie "${movieTitle}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            setSaving(true);
            await deleteMovie(movieId);
            setMovies((prev) => prev.filter((m) => m.id !== movieId));
            addNotification({
              type: "success",
              title: "Success",
              message: "Movie deleted successfully",
            });
            closeConfirmDialog();
          } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            const statusCode = error?.response?.status;

            let errorMessage = "Failed to delete movie";

            if (statusCode === 400) {
              errorMessage =
                backendMessage ||
                "Cannot delete movie. It may be referenced by screenings or bookings.";
            } else if (statusCode === 404) {
              errorMessage = "Movie not found";
            } else if (backendMessage) {
              errorMessage = backendMessage;
            }

            console.error("Movie deletion error:", {
              status: statusCode,
              message: backendMessage,
              data: error?.response?.data,
            });

            addNotification({
              type: "error",
              title: "Error",
              message: errorMessage,
            });
          } finally {
            setSaving(false);
          }
        },
      });
    },
    [showConfirmDialog, closeConfirmDialog, addNotification]
  );

  return {
    movies,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateMovie,
    handleUpdateMovie,
    handleDeleteMovie,
    closeConfirmDialog,
  };
}
