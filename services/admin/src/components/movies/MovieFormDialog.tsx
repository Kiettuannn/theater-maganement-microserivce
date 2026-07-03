import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import type {
  Movie,
  CreateMovieRequest,
  Genre,
  AgeRating,
} from "@/types/MovieType/Movie";
import { getAllGenres } from "@/services/genreService";
import { getAllAgeRatings } from "@/services/ageRatingService";

interface MovieFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMovieRequest) => Promise<boolean>;
  movie?: Movie | null;
  saving?: boolean;
}

export function MovieFormDialog({
  isOpen,
  onClose,
  onSubmit,
  movie,
  saving = false,
}: MovieFormDialogProps) {
  const [formData, setFormData] = useState<CreateMovieRequest>({
    title: "",
    description: "",
    durationMinutes: 90,
    director: "",
    castMembers: "",
    posterUrl: "",
    trailerUrl: "",
    releaseDate: "",
    endDate: "",
    status: "coming_soon",
    ageRatingId: "",
    genreIds: [],
  });

  const [genres, setGenres] = useState<Genre[]>([]);
  const [ageRatings, setAgeRatings] = useState<AgeRating[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);

  // Load genres and age ratings
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [genresData, ageRatingsData] = await Promise.all([
          getAllGenres(),
          getAllAgeRatings(),
        ]);
        setGenres(genresData);
        setAgeRatings(ageRatingsData);
      } catch (error) {
        console.error("Failed to load form data:", error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (movie) {
      setFormData({
        title: movie.title,
        description: movie.description,
        durationMinutes: movie.durationMinutes,
        director: movie.director,
        castMembers: movie.castMembers,
        posterUrl: movie.posterUrl,
        trailerUrl: movie.trailerUrl,
        releaseDate: movie.releaseDate,
        endDate: movie.endDate,
        status: movie.status,
        ageRatingId: movie.ageRating.id,
        genreIds: movie.genres.map((g) => g.id),
      });
    } else {
      setFormData({
        title: "",
        description: "",
        durationMinutes: 90,
        director: "",
        castMembers: "",
        posterUrl: "",
        trailerUrl: "",
        releaseDate: "",
        endDate: "",
        status: "coming_soon",
        ageRatingId: "",
        genreIds: [],
      });
    }
    setErrors({});
  }, [movie, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || !formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 255) {
      newErrors.title = "Title must not exceed 255 characters";
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 5000) {
      newErrors.description = "Description must not exceed 5000 characters";
    }

    if (!formData.durationMinutes || formData.durationMinutes <= 0) {
      newErrors.durationMinutes = "Duration must be positive";
    } else if (formData.durationMinutes > 500) {
      newErrors.durationMinutes = "Duration must not exceed 500 minutes";
    }

    if (!formData.director || !formData.director.trim()) {
      newErrors.director = "Director is required";
    } else if (formData.director.length > 255) {
      newErrors.director = "Director must not exceed 255 characters";
    }

    if (!formData.castMembers || !formData.castMembers.trim()) {
      newErrors.castMembers = "Cast is required";
    } else if (formData.castMembers.length > 2000) {
      newErrors.castMembers = "Cast must not exceed 2000 characters";
    }

    // URL validation - must start with http:// or https://
    if (!formData.posterUrl || !formData.posterUrl.trim()) {
      newErrors.posterUrl = "Poster URL is required";
    } else if (!formData.posterUrl.match(/^https?:\/\/.+/)) {
      newErrors.posterUrl = "URL must start with http:// or https://";
    }

    if (!formData.trailerUrl || !formData.trailerUrl.trim()) {
      newErrors.trailerUrl = "Trailer URL is required";
    } else if (!formData.trailerUrl.match(/^https?:\/\/.+/)) {
      newErrors.trailerUrl = "URL must start with http:// or https://";
    }

    if (!formData.releaseDate) {
      newErrors.releaseDate = "Release date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (!formData.ageRatingId || !formData.ageRatingId.trim()) {
      newErrors.ageRatingId = "Age rating is required";
    }

    if (!formData.genreIds || formData.genreIds.length === 0) {
      newErrors.genreIds = "At least one genre is required";
    } else if (formData.genreIds.length > 10) {
      newErrors.genreIds = "Maximum 10 genres allowed";
    }

    // Validate dates
    if (formData.releaseDate && formData.endDate) {
      const releaseDate = new Date(formData.releaseDate);
      const endDate = new Date(formData.endDate);
      if (endDate < releaseDate) {
        newErrors.endDate = "End date must be after release date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Debug logging - show what we're sending
    console.group("🎬 Movie Form Submission");
    console.log(
      "Form data being submitted:",
      JSON.stringify(formData, null, 2),
    );
    console.log("Data types check:");
    console.log(
      "- durationMinutes type:",
      typeof formData.durationMinutes,
      "value:",
      formData.durationMinutes,
    );
    console.log(
      "- genreIds type:",
      typeof formData.genreIds,
      "isArray:",
      Array.isArray(formData.genreIds),
      "value:",
      formData.genreIds,
    );
    console.log("- status:", formData.status);
    console.log("- ageRatingId:", formData.ageRatingId);
    console.groupEnd();

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    let processedValue = value;

    // Auto-add https:// to URLs when user leaves the field (on blur would be better, but this works on change)
    // We'll only auto-correct when the value looks like a URL but is missing the protocol
    if (
      (name === "posterUrl" || name === "trailerUrl") &&
      value &&
      !value.match(/^https?:\/\//)
    ) {
      // Check if it looks like a URL (contains a dot)
      if (value.includes(".")) {
        // Don't auto-correct while typing, wait for a complete-looking URL
        // Only auto-correct if it starts with common patterns
        if (
          value.startsWith("www.") ||
          value.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)
        ) {
          processedValue = `https://${value}`;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "durationMinutes"
          ? parseInt(processedValue) || 0
          : processedValue,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleGenreToggle = (genreId: string) => {
    setFormData((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((id) => id !== genreId)
        : [...prev.genreIds, genreId],
    }));
    // Clear error
    if (errors.genreIds) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.genreIds;
        return newErrors;
      });
    }
  };

  if (loadingData) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={movie ? "Edit Movie" : "Add New Movie"}
        maxWidth="2xl"
      >
        <div className="p-8 text-center text-muted-foreground">
          Loading form data...
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={movie ? "Edit Movie" : "Add New Movie"}
      maxWidth="2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
      >
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Title
          </label>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Movie title"
            disabled={saving}
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && (
            <p className="text-xs text-destructive mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Movie description"
            disabled={saving}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
              errors.description ? "border-destructive" : "border-input"
            }`}
          />
          {errors.description && (
            <p className="text-xs text-destructive mt-1">
              {errors.description}
            </p>
          )}
        </div>

        {/* Director and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Director
            </label>
            <Input
              type="text"
              name="director"
              value={formData.director}
              onChange={handleChange}
              placeholder="Director name"
              disabled={saving}
              className={errors.director ? "border-destructive" : ""}
            />
            {errors.director && (
              <p className="text-xs text-destructive mt-1">{errors.director}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Duration (minutes)
            </label>
            <Input
              type="number"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              placeholder="90"
              disabled={saving}
              min="1"
              className={errors.durationMinutes ? "border-destructive" : ""}
            />
            {errors.durationMinutes && (
              <p className="text-xs text-destructive mt-1">
                {errors.durationMinutes}
              </p>
            )}
          </div>
        </div>

        {/* Cast */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Cast
          </label>
          <Input
            type="text"
            name="castMembers"
            value={formData.castMembers}
            onChange={handleChange}
            placeholder="Actor 1, Actor 2, Actor 3"
            disabled={saving}
            className={errors.castMembers ? "border-destructive" : ""}
          />
          {errors.castMembers && (
            <p className="text-xs text-destructive mt-1">
              {errors.castMembers}
            </p>
          )}
        </div>

        {/* Poster URL and Trailer URL */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Poster URL
            </label>
            <Input
              type="url"
              name="posterUrl"
              value={formData.posterUrl}
              onChange={handleChange}
              placeholder="https://example.com/poster.jpg"
              disabled={saving}
              className={errors.posterUrl ? "border-destructive" : ""}
            />
            {errors.posterUrl ? (
              <p className="text-xs text-destructive mt-1">
                {errors.posterUrl}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Must start with http:// or https://
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Trailer URL
            </label>
            <Input
              type="url"
              name="trailerUrl"
              value={formData.trailerUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=..."
              disabled={saving}
              className={errors.trailerUrl ? "border-destructive" : ""}
            />
            {errors.trailerUrl ? (
              <p className="text-xs text-destructive mt-1">
                {errors.trailerUrl}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Must start with http:// or https://
              </p>
            )}
          </div>
        </div>

        {/* Release Date and End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Release Date
            </label>
            <Input
              type="date"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleChange}
              disabled={saving}
              className={errors.releaseDate ? "border-destructive" : ""}
            />
            {errors.releaseDate && (
              <p className="text-xs text-destructive mt-1">
                {errors.releaseDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              End Date
            </label>
            <Input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              disabled={saving}
              className={errors.endDate ? "border-destructive" : ""}
            />
            {errors.endDate && (
              <p className="text-xs text-destructive mt-1">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Status and Age Rating */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={saving}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="now_showing">Now Showing</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Age Rating
            </label>
            <select
              name="ageRatingId"
              value={formData.ageRatingId}
              onChange={handleChange}
              disabled={saving}
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                errors.ageRatingId ? "border-destructive" : "border-input"
              }`}
            >
              <option value="">Select age rating</option>
              {ageRatings.map((rating) => (
                <option key={rating.id} value={rating.id}>
                  {rating.code} - {rating.description}
                </option>
              ))}
            </select>
            {errors.ageRatingId && (
              <p className="text-xs text-destructive mt-1">
                {errors.ageRatingId}
              </p>
            )}
          </div>
        </div>

        {/* Genres */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Genres
          </label>
          <div className="flex flex-wrap gap-2 p-3 border border-input rounded-md bg-background">
            {genres.map((genre) => (
              <label
                key={genre.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                  formData.genreIds.includes(genre.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.genreIds.includes(genre.id)}
                  onChange={() => handleGenreToggle(genre.id)}
                  disabled={saving}
                  className="sr-only"
                />
                <span className="text-sm">{genre.name}</span>
              </label>
            ))}
          </div>
          {errors.genreIds && (
            <p className="text-xs text-destructive mt-1">{errors.genreIds}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : movie ? "Update Movie" : "Create Movie"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
