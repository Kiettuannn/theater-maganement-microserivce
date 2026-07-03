import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import type { MovieSimple } from "@/services/movieService";
import type { ShowtimeResponse } from "@/services/showtimeService";

interface ShowtimeSelectionStepProps {
  movie: MovieSimple;
  showtimes: ShowtimeResponse[];
  loading: boolean;
  onSelectShowtime: (showtime: ShowtimeResponse) => void;
}

export default function ShowtimeSelectionStep({
  movie,
  showtimes,
  loading,
  onSelectShowtime,
}: ShowtimeSelectionStepProps) {
  const groupedByDate = useMemo(() => {
    return showtimes.reduce(
      (acc, showtime) => {
        const date = format(new Date(showtime.startTime), "yyyy-MM-dd");
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(showtime);
        return acc;
      },
      {} as Record<string, ShowtimeResponse[]>,
    );
  }, [showtimes]);

  const sortedDates = useMemo(
    () => Object.keys(groupedByDate).sort(),
    [groupedByDate],
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [tempSelectedShowtime, setTempSelectedShowtime] =
    useState<ShowtimeResponse | null>(null);

  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0]);
    } else if (selectedDate && !sortedDates.includes(selectedDate)) {
      setSelectedDate(sortedDates[0] || "");
    }
  }, [sortedDates, selectedDate]);

  const visibleShowtimes = selectedDate
    ? groupedByDate[selectedDate] || []
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading showtimes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">{movie.title}</h2>
          <p className="text-gray-500 text-sm">
            Duration: {movie.durationMinutes} minutes
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 rounded-lg p-3">
        <span className="text-sm font-semibold text-gray-700">Select date</span>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sortedDates.length === 0}
        >
          {sortedDates.map((date) => (
            <option key={date} value={date}>
              {format(new Date(date), "EEEE, MMMM d, yyyy")}
            </option>
          ))}
        </select>
      </div>

      {visibleShowtimes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No showtimes available for this movie</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">
              {selectedDate
                ? format(new Date(selectedDate), "EEEE, MMMM d, yyyy")
                : ""}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleShowtimes.map((showtime) => (
                <Card
                  key={showtime.id}
                  className={`p-3 cursor-pointer hover:shadow-lg transition-all ${
                    tempSelectedShowtime?.id === showtime.id
                      ? "ring-2 ring-blue-600 shadow-lg bg-blue-50"
                      : ""
                  }`}
                  onClick={() => {
                    setTempSelectedShowtime(showtime);
                    onSelectShowtime(showtime);
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Clock className="w-4 h-4" />
                      {format(new Date(showtime.startTime), "HH:mm")}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {showtime.roomName}
                    </div>
                    <p className="text-xs text-gray-500">
                      {showtime.cinemaName}
                    </p>
                    <div className="text-xs font-semibold text-blue-600 mt-2">
                      {showtime.status === "SCHEDULED" && "Available"}
                      {showtime.status === "ONGOING" && "Ongoing"}
                      {showtime.status === "COMPLETED" && "Completed"}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {tempSelectedShowtime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">
                  Selected Showtime
                </h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold">
                      {format(
                        new Date(tempSelectedShowtime.startTime),
                        "HH:mm",
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span>{tempSelectedShowtime.roomName}</span>
                  </div>
                  <span className="text-gray-600">
                    {tempSelectedShowtime.cinemaName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
