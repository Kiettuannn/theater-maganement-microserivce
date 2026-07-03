import { Film } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { MovieSimple } from "@/services/movieService";

interface MovieSelectionStepProps {
  movies: MovieSimple[];
  loading: boolean;
  onSelectMovie: (movie: MovieSimple) => void;
  selectedMovie: MovieSimple | null;
}

export default function MovieSelectionStep({
  movies,
  loading,
  onSelectMovie,
  selectedMovie,
}: MovieSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [movies, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading movies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Select a Movie</h2>
        <Input
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-6"
        />
      </div>

      {filteredMovies.length === 0 ? (
        <div className="text-center py-12">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No movies found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMovies.map((movie) => (
              <Card
                key={movie.id}
                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
                  selectedMovie?.id === movie.id
                    ? "ring-2 ring-blue-600 shadow-lg"
                    : ""
                }`}
                onClick={() => onSelectMovie(movie)}
              >
                <div className="relative overflow-hidden bg-gray-200 h-48">
                  {movie.posterUrl && (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold truncate mb-2">{movie.title}</h3>
                  <p className="text-xs text-gray-500">
                    Duration: {movie.durationMinutes} min
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {selectedMovie && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Selected Movie
              </h4>
              <div className="flex gap-4">
                <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0">
                  {selectedMovie.posterUrl && (
                    <img
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-lg mb-2">
                    {selectedMovie.title}
                  </h5>
                  <p className="text-xs text-gray-500">
                    Duration: {selectedMovie.durationMinutes} minutes
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
