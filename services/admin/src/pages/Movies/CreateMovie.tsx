import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui";
import { Plus, ArrowLeft } from "lucide-react";
import { useNotificationStore } from "@/stores";
import { ROUTES } from "@/constants/routes";
import type {
  CreateMovieRequest,
  Genre,
  AgeRating,
} from "@/types/MovieType/Movie";
import { getAllGenres } from "@/services/genreService";
import { getAllAgeRatings } from "@/services/ageRatingService";
import { createMovie } from "@/services/movieService";

export function CreateMovie() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

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
  const [loading, setLoading] = useState(false);
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
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to load form data",
        });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [addNotification]);

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

    try {
      setLoading(true);
      await createMovie(formData);

      addNotification({
        type: "success",
        title: "Success",
        message: "Movie created successfully!",
      });

      navigate(ROUTES.MOVIES);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to create movie",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.MOVIES);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    let processedValue = value;

    if (
      (name === "posterUrl" || name === "trailerUrl") &&
      value &&
      !value.match(/^https?:\/\//)
    ) {
      if (value.includes(".")) {
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

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleGenreToggle = (genreId: string, e?: React.MouseEvent) => {
    // Prevent default to avoid layout shift
    if (e) {
      e.preventDefault();
    }

    setFormData((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((id) => id !== genreId)
        : [...prev.genreIds, genreId],
    }));

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            Create New Movie
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a new movie to your catalog.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Movie Information
            </CardTitle>
            <CardDescription>
              Fill in the details below to create a new movie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Movie title"
                  disabled={loading}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Movie description"
                  disabled={loading}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                    errors.description ? "border-destructive" : "border-input"
                  }`}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Director and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="director">Director *</Label>
                  <Input
                    id="director"
                    type="text"
                    name="director"
                    value={formData.director}
                    onChange={handleChange}
                    placeholder="Director name"
                    disabled={loading}
                    className={errors.director ? "border-destructive" : ""}
                  />
                  {errors.director && (
                    <p className="text-xs text-destructive">
                      {errors.director}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (minutes) *</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleChange}
                    placeholder="90"
                    disabled={loading}
                    min="1"
                    className={
                      errors.durationMinutes ? "border-destructive" : ""
                    }
                  />
                  {errors.durationMinutes && (
                    <p className="text-xs text-destructive">
                      {errors.durationMinutes}
                    </p>
                  )}
                </div>
              </div>

              {/* Cast */}
              <div className="space-y-2">
                <Label htmlFor="cast">Cast *</Label>
                <Input
                  id="cast"
                  type="text"
                  name="castMembers"
                  value={formData.castMembers}
                  onChange={handleChange}
                  placeholder="Actor 1, Actor 2, Actor 3"
                  disabled={loading}
                  className={errors.castMembers ? "border-destructive" : ""}
                />
                {errors.castMembers && (
                  <p className="text-xs text-destructive">
                    {errors.castMembers}
                  </p>
                )}
              </div>

              {/* Poster URL and Trailer URL */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="posterUrl">Poster URL *</Label>
                  <Input
                    id="posterUrl"
                    type="url"
                    name="posterUrl"
                    value={formData.posterUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/poster.jpg"
                    disabled={loading}
                    className={errors.posterUrl ? "border-destructive" : ""}
                  />
                  {errors.posterUrl ? (
                    <p className="text-xs text-destructive">
                      {errors.posterUrl}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Must start with http:// or https://
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trailerUrl">Trailer URL *</Label>
                  <Input
                    id="trailerUrl"
                    type="url"
                    name="trailerUrl"
                    value={formData.trailerUrl}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={loading}
                    className={errors.trailerUrl ? "border-destructive" : ""}
                  />
                  {errors.trailerUrl ? (
                    <p className="text-xs text-destructive">
                      {errors.trailerUrl}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Must start with http:// or https://
                    </p>
                  )}
                </div>
              </div>

              {/* Release Date and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="releaseDate">Release Date *</Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.releaseDate ? "border-destructive" : ""}
                  />
                  {errors.releaseDate && (
                    <p className="text-xs text-destructive">
                      {errors.releaseDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.endDate ? "border-destructive" : ""}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Status and Age Rating */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageRatingId">Age Rating *</Label>
                  <select
                    id="ageRatingId"
                    name="ageRatingId"
                    value={formData.ageRatingId}
                    onChange={handleChange}
                    disabled={loading}
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
                    <p className="text-xs text-destructive">
                      {errors.ageRatingId}
                    </p>
                  )}
                </div>
              </div>

              {/* Genres */}
              <div className="space-y-2">
                <Label>Genres *</Label>
                <div className="flex flex-wrap gap-2 p-3 border border-input rounded-md bg-background min-h-[60px]">
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={(e) => handleGenreToggle(genre.id, e)}
                      disabled={loading}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                        formData.genreIds.includes(genre.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span className="text-sm">{genre.name}</span>
                    </button>
                  ))}
                </div>
                {errors.genreIds && (
                  <p className="text-xs text-destructive">{errors.genreIds}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Movie
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
