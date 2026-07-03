import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Calendar,
  Film,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { MovieSimple } from "@/types/MovieType/Movie";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface MovieTableProps {
  movies: MovieSimple[];
  isLoading?: boolean;
  onEdit?: (movie: MovieSimple) => void;
  onDelete?: (movie: MovieSimple) => void;
  updatingCell?: string;
}

const statusLabels = {
  now_showing: "Now Showing",
  coming_soon: "Coming Soon",
  archived: "Archived",
};

const statusColors = {
  now_showing:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  coming_soon: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function MovieTable({
  movies,
  isLoading = false,
  onEdit,
  onDelete,
  updatingCell,
}: MovieTableProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            Loading movies...
          </div>
        </div>
      </Card>
    );
  }

  if (movies.length === 0) {
    return (
      <Card>
        <div className="p-12 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            No movies found
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left font-semibold text-sm p-3 min-w-[80px]">
                Poster
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[200px]">
                Title
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[150px]">
                Director
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                Duration
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[130px]">
                Release Date
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                Status
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                Age Rating
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => (
              <tr
                key={movie.id}
                className={cn(
                  "border-b border-border hover:bg-accent/50 transition-colors",
                  index === movies.length - 1 && "border-b-0",
                )}
              >
                {/* Poster */}
                <td className="p-3">
                  <div className="w-12 h-16 rounded overflow-hidden bg-muted">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='64' viewBox='0 0 48 64'%3E%3Crect width='48' height='64' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='Arial' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                </td>

                {/* Title */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground line-clamp-2">
                      {movie.title}
                    </p>
                    {movie.needsArchiveWarning && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
                            <AlertTriangle className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            No screenings in the next 7 days. Consider
                            archiving.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </td>

                {/* Director */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {movie.director}
                    </span>
                  </div>
                </td>

                {/* Duration */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {movie.durationMinutes} min
                    </span>
                  </div>
                </td>

                {/* Release Date */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="p-3">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      statusColors[movie.status],
                    )}
                  >
                    {statusLabels[movie.status]}
                  </span>
                </td>

                {/* Age Rating */}
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded text-xs font-bold">
                    {movie.ageRatingCode}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit?.(movie)}
                      disabled={updatingCell !== undefined}
                      title="Edit movie"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete?.(movie)}
                      disabled={updatingCell !== undefined}
                      title="Delete movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
