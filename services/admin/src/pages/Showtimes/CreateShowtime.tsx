import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Clock, Film, MapPin } from "lucide-react";
import { getAllMovies } from "@/services/movieService";
import type { MovieSimple } from "@/types/MovieType/Movie";
import { getAllCinemas, type Cinema } from "@/services/cinemaService";
import { getRoomsByCinema, type Room } from "@/services/roomService";
import { getShowtimesByRoom, createShowtime, type ShowtimeResponse } from "@/services/showtimeService";
import { useNotificationStore } from "@/stores";
import { format, addMinutes, parse, isBefore, isAfter } from "date-fns";
import { ROUTES } from "@/constants/routes";

export function CreateShowtime() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [existingShowtimes, setExistingShowtimes] = useState<ShowtimeResponse[]>([]);

  const [selectedMovie, setSelectedMovie] = useState<MovieSimple | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Load initial data
  useEffect(() => {
    loadMovies();
    loadCinemas();
  }, []);

  const loadMovies = async () => {
    try {
      const data = await getAllMovies();
      setMovies(data);
    } catch (error) {
      console.error("Failed to load movies:", error);
    }
  };

  const loadCinemas = async () => {
    try {
      const data = await getAllCinemas();
      setCinemas(data);
    } catch (error) {
      console.error("Failed to load cinemas:", error);
    }
  };

  // Load rooms when cinema is selected
  useEffect(() => {
    if (selectedCinema) {
      loadRooms(selectedCinema.id);
    } else {
      setRooms([]);
      setSelectedRoom(null);
    }
  }, [selectedCinema]);

  const loadRooms = async (cinemaId: string) => {
    try {
      const response = await getRoomsByCinema(cinemaId);
      setRooms(response.data.result || []);
    } catch (error) {
      console.error("Failed to load rooms:", error);
    }
  };

  // Load existing showtimes when room is selected
  useEffect(() => {
    if (selectedRoom) {
      loadExistingShowtimes(selectedRoom.id);
    } else {
      setExistingShowtimes([]);
    }
  }, [selectedRoom]);

  const loadExistingShowtimes = async (roomId: string) => {
    try {
      const data = await getShowtimesByRoom(roomId);
      setExistingShowtimes(data);
    } catch (error) {
      console.error("Failed to load existing showtimes:", error);
    }
  };

  // Auto-calculate end time based on movie duration + cinema buffer
  useEffect(() => {
    if (selectedMovie && startTime) {
      if (selectedMovie.durationMinutes) {
        try {
          const start = parse(startTime, "yyyy-MM-dd'T'HH:mm", new Date());
          
          if (!isNaN(start.getTime())) {
            const buffer = selectedCinema?.buffer || 0;
            const totalMinutes = selectedMovie.durationMinutes + buffer;
            const end = addMinutes(start, totalMinutes);
            const endTimeStr = format(end, "yyyy-MM-dd'T'HH:mm");
            setEndTime(endTimeStr);
          } else {
            console.error("Invalid start time");
          }
        } catch (error) {
          console.error("Error calculating end time:", error);
        }
      }
    }
  }, [selectedMovie, startTime, selectedCinema]);

  const handleMovieChange = (movieId: string) => {
    const movie = movies.find((m) => m.id === movieId);
    setSelectedMovie(movie || null);
  };

  const handleCinemaChange = (cinemaId: string) => {
    const cinema = cinemas.find((c) => c.id === cinemaId);
    setSelectedCinema(cinema || null);
  };

  const handleRoomChange = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    setSelectedRoom(room || null);
  };

  const checkTimeOverlap = (): boolean => {
    if (!startTime || !endTime) return false;

    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    return existingShowtimes.some((showtime) => {
      const existingStart = new Date(showtime.startTime);
      const existingEnd = new Date(showtime.endTime);

      // Check if there's any overlap
      return (
        (isBefore(newStart, existingEnd) && isAfter(newEnd, existingStart)) ||
        (isBefore(existingStart, newEnd) && isAfter(existingEnd, newStart))
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMovie || !selectedRoom || !startTime || !endTime) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields",
      });
      return;
    }

    if (checkTimeOverlap()) {
      addNotification({
        type: "error",
        title: "Time Overlap",
        message: "The selected time overlaps with an existing showtime in this room",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Format datetime without timezone conversion
      // Backend expects format: "yyyy-MM-dd'T'HH:mm:ss"
      const formatForBackend = (dateTimeString: string) => {
        return dateTimeString + ":00"; // Add seconds
      };

      const payload = {
        movieId: selectedMovie.id,
        roomId: selectedRoom.id,
        startTime: formatForBackend(startTime),
        endTime: formatForBackend(endTime),
      };
      
      await createShowtime(payload);

      addNotification({
        type: "success",
        title: "Success",
        message: "Showtime created successfully",
      });

      navigate(ROUTES.SHOWTIMES);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to create showtime",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(ROUTES.SHOWTIMES)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <PageHeader
          title="Create New Showtime"
          description="Schedule a new movie showtime"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Movie Information</h3>

          {/* Movie Selection */}
          <div className="space-y-2">
            <Label htmlFor="movie" className="flex items-center gap-2">
              <Film className="h-4 w-4 text-muted-foreground" />
              Select Movie <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedMovie?.id || ""} onValueChange={handleMovieChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a movie" />
              </SelectTrigger>
              <SelectContent>
                {movies.map((movie) => (
                  <SelectItem key={movie.id} value={movie.id}>
                    {movie.title} ({movie.durationMinutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMovie && (
              <p className="text-sm text-muted-foreground">
                Duration: {selectedMovie.durationMinutes} minutes
                {selectedCinema?.buffer ? ` + ${selectedCinema.buffer} min buffer` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Location</h3>

          {/* Cinema Selection */}
          <div className="space-y-2">
            <Label htmlFor="cinema" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Select Cinema <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedCinema?.id || ""} onValueChange={handleCinemaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a cinema" />
              </SelectTrigger>
              <SelectContent>
                {cinemas.map((cinema) => (
                  <SelectItem key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="room" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Select Room <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedRoom?.id || ""}
              onValueChange={handleRoomChange}
              disabled={!selectedCinema}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCinema ? "Choose a room" : "Select a cinema first"} />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} - {room.totalSeats} seats
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Schedule</h3>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Start Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="endTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              End Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              {selectedMovie ? (
                selectedCinema?.buffer 
                  ? `Auto-calculated: ${selectedMovie.durationMinutes} min (movie) + ${selectedCinema.buffer} min (buffer)`
                  : `Auto-calculated based on movie duration (${selectedMovie.durationMinutes} min)`
              ) : "Select a movie to auto-calculate"}
            </p>
          </div>

          {/* Existing Showtimes */}
          {selectedRoom && existingShowtimes.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Existing Showtimes in {selectedRoom.name}
              </h4>
              <div className="space-y-2">
                {existingShowtimes.map((showtime) => (
                  <div
                    key={showtime.id}
                    className="text-sm text-muted-foreground flex items-center justify-between"
                  >
                    <span>{showtime.movieName}</span>
                    <span>
                      {format(new Date(showtime.startTime), "dd/MM/yyyy HH:mm")} -{" "}
                      {format(new Date(showtime.endTime), "HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.SHOWTIMES)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Showtime"}
          </Button>
        </div>
      </form>
    </div>
  );
}
