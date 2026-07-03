import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, AlertTriangle, Film } from "lucide-react";
import { useNotificationStore } from "@/stores";
import {
  getAllGenres,
  createGenre,
  deleteGenre,
  getMoviesUsingGenre,
} from "@/services/genreService";
import {
  getAllAgeRatings,
  createAgeRating,
  deleteAgeRating,
  getMoviesUsingAgeRating,
} from "@/services/ageRatingService";
import type { Genre, AgeRating } from "@/types/MovieType/Movie";

interface GenreManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

type TabType = "genres" | "ageRatings";

export function GenreManager({ isOpen, onClose, onUpdate }: GenreManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("genres");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [ageRatings, setAgeRatings] = useState<AgeRating[]>([]);
  const [, setLoading] = useState(false);

  // New item states
  const [newGenre, setNewGenre] = useState({ name: "" });
  const [newAgeRating, setNewAgeRating] = useState({
    id: "",
    code: "",
    description: "",
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "genre" | "ageRating";
    id: string;
    name: string;
    moviesUsing: any[];
  }>({
    isOpen: false,
    type: "genre",
    id: "",
    name: "",
    moviesUsing: [],
  });

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [genresData, ratingsData] = await Promise.all([
        getAllGenres(),
        getAllAgeRatings(),
      ]);
      setGenres(genresData);
      setAgeRatings(ratingsData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = async () => {
    if (!newGenre.name.trim()) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Name is required",
      });
      return;
    }

    try {
      // Generate ID from name (lowercase, no spaces)
      const generatedId = newGenre.name.toLowerCase().replace(/\s+/g, "-");
      await createGenre({ id: generatedId, name: newGenre.name });
      addNotification({
        type: "success",
        title: "Success",
        message: "Genre created successfully",
      });
      setNewGenre({ name: "" });
      loadData();
      onUpdate?.();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to create genre",
      });
    }
  };

  const handleDeleteGenre = async (id: string, name: string) => {
    try {
      // Check which movies are using this genre
      const moviesUsing = await getMoviesUsingGenre(id);
      setDeleteConfirm({
        isOpen: true,
        type: "genre",
        id,
        name,
        moviesUsing,
      });
    } catch (error: any) {
      console.error("Error checking genre usage:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to check genre usage",
      });
    }
  };

  const confirmDelete = async () => {
    const { type, id, name } = deleteConfirm;

    try {
      if (type === "genre") {
        await deleteGenre(id);
      } else {
        await deleteAgeRating(id);
      }

      addNotification({
        type: "success",
        title: "Success",
        message: `${type === "genre" ? "Genre" : "Age rating"} "${name}" deleted successfully`,
      });
      setDeleteConfirm({
        isOpen: false,
        type: "genre",
        id: "",
        name: "",
        moviesUsing: [],
      });
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      addNotification({
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          `Failed to delete ${type}. It may be in use.`,
      });
    }
  };

  const handleAddAgeRating = async () => {
    if (
      !newAgeRating.id.trim() ||
      !newAgeRating.code.trim() ||
      !newAgeRating.description.trim()
    ) {
      addNotification({
        type: "error",
        title: "Error",
        message: "All fields are required",
      });
      return;
    }

    try {
      await createAgeRating(newAgeRating);
      addNotification({
        type: "success",
        title: "Success",
        message: "Age rating created successfully",
      });
      setNewAgeRating({ id: "", code: "", description: "" });
      loadData();
      onUpdate?.();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message || "Failed to create age rating",
      });
    }
  };

  const handleDeleteAgeRating = async (id: string, name: string) => {
    try {
      // Check which movies are using this age rating
      const moviesUsing = await getMoviesUsingAgeRating(id);
      setDeleteConfirm({
        isOpen: true,
        type: "ageRating",
        id,
        name,
        moviesUsing,
      });
    } catch (error: any) {
      console.error("Error checking age rating usage:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to check age rating usage",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Genres & Age Ratings"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("genres")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "genres"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Genres
          </button>
          <button
            onClick={() => setActiveTab("ageRatings")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "ageRatings"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Age Ratings
          </button>
        </div>

        {/* Genres Tab */}
        {activeTab === "genres" && (
          <div className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 w-12">#</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-right p-2 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {genres.map((genre, index) => (
                    <tr key={genre.id} className="border-b">
                      <td className="p-2 text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="p-2">{genre.name}</td>
                      <td className="p-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleDeleteGenre(genre.id, genre.name)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {/* Add new row */}
                  <tr className="border-b bg-muted/30">
                    <td className="p-2 text-sm text-muted-foreground">
                      {genres.length + 1}
                    </td>
                    <td className="p-2">
                      <Input
                        placeholder="Enter genre name..."
                        value={newGenre.name}
                        onChange={(e) => setNewGenre({ name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddGenre();
                        }}
                        className="h-8"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <Button size="sm" onClick={handleAddGenre}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Age Ratings Tab */}
        {activeTab === "ageRatings" && (
          <div className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ageRatings.map((rating) => (
                    <tr key={rating.id} className="border-b">
                      <td className="p-2 text-sm">{rating.id}</td>
                      <td className="p-2">{rating.code}</td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {rating.description}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleDeleteAgeRating(rating.id, rating.code)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {/* Add new row */}
                  <tr className="border-b bg-muted/30">
                    <td className="p-2">
                      <Input
                        placeholder="ID"
                        value={newAgeRating.id}
                        onChange={(e) =>
                          setNewAgeRating({
                            ...newAgeRating,
                            id: e.target.value,
                          })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        placeholder="Code (e.g., P, C13)"
                        value={newAgeRating.code}
                        onChange={(e) =>
                          setNewAgeRating({
                            ...newAgeRating,
                            code: e.target.value,
                          })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        placeholder="Description"
                        value={newAgeRating.description}
                        onChange={(e) =>
                          setNewAgeRating({
                            ...newAgeRating,
                            description: e.target.value,
                          })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <Button size="sm" onClick={handleAddAgeRating}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  Delete{" "}
                  {deleteConfirm.type === "genre" ? "Genre" : "Age Rating"}
                </h3>

                {deleteConfirm.moviesUsing.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Cannot delete{" "}
                      <span className="font-semibold text-foreground">
                        "{deleteConfirm.name}"
                      </span>{" "}
                      because it is being used by the following movies:
                    </p>
                    <div className="max-h-[200px] overflow-y-auto bg-muted/50 rounded-md p-3 space-y-2">
                      {deleteConfirm.moviesUsing.map((movie) => (
                        <div
                          key={movie.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Film className="h-4 w-4 text-primary" />
                          <span className="font-medium">{movie.title}</span>
                          <span className="text-xs text-muted-foreground">
                            ({movie.releaseDate})
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please remove this {deleteConfirm.type} from these movies
                      first.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-foreground">
                      "{deleteConfirm.name}"
                    </span>
                    ? This action cannot be undone.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    type: "genre",
                    id: "",
                    name: "",
                    moviesUsing: [],
                  })
                }
              >
                {deleteConfirm.moviesUsing.length > 0 ? "Close" : "Cancel"}
              </Button>
              {deleteConfirm.moviesUsing.length === 0 && (
                <Button variant="destructive" onClick={confirmDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
