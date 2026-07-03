import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Trash2, Star, MessageSquare, Film } from "lucide-react";
import type { MovieReview } from "@/types/review";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ReviewTableProps {
  reviews: MovieReview[];
  isLoading?: boolean;
  onDelete?: (review: MovieReview) => void;
  selectedMovie?: boolean;
}

export function ReviewTable({
  reviews,
  isLoading = false,
  onDelete,
  selectedMovie = false,
}: ReviewTableProps) {
  if (!selectedMovie) {
    return (
      <Card>
        <div className="p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Film className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Select a movie</p>
            <p className="text-muted-foreground">
              Choose a movie from the dropdown above to view its reviews
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading reviews...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <div className="p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No reviews found</p>
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
              <th className="text-left font-semibold text-sm p-3 min-w-[150px]">
                Customer
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[200px]">
                Movie
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                Rating
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[300px]">
                Comment
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                Helpful
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                Date
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, index) => (
              <tr
                key={review.id}
                className={cn(
                  "border-b border-border hover:bg-accent/50 transition-colors",
                  index === reviews.length - 1 && "border-b-0",
                )}
              >
                {/* Customer */}
                <td className="p-3">
                  <div className="font-medium text-foreground">
                    {review.customer.firstName} {review.customer.lastName}
                  </div>
                </td>

                {/* Movie */}
                <td className="p-3">
                  <div className="font-medium text-foreground">
                    {review.movie.title}
                  </div>
                </td>

                {/* Rating */}
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{review.rating}</span>
                    <span className="text-muted-foreground">/10</span>
                  </div>
                </td>

                {/* Comment */}
                <td className="p-3">
                  {review.comment ? (
                    <div className="space-y-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="max-w-md truncate cursor-pointer text-sm text-foreground">
                              {review.comment}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <p className="whitespace-pre-wrap">
                              {review.comment}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {review.isSpoiler && (
                        <Badge variant="destructive" className="text-xs">
                          Spoiler
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">
                      No comment
                    </span>
                  )}
                </td>

                {/* Helpful */}
                <td className="p-3">
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-green-600">
                      👍 {review.helpfulCount}
                    </span>
                    <span className="text-red-600">
                      👎 {review.unhelpfulCount}
                    </span>
                  </div>
                </td>

                {/* Date */}
                <td className="p-3">
                  <div className="text-sm text-foreground">
                    {format(new Date(review.createdAt), "MMM dd, yyyy")}
                  </div>
                </td>

                {/* Actions */}
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete?.(review)}
                      title="Delete review"
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
