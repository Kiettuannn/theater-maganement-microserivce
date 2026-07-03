import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Film, Clock, DoorOpen, MapPin } from "lucide-react";
import { getAllMovies } from "@/services/movieService";
import type { MovieSimple } from "@/types/MovieType/Movie";
import type { Room } from "@/types/RoomType/room";
import {
  getShowtimesByRoom,
  createShowtime,
  type ShowtimeResponse,
} from "@/services/showtimeService";
import { useNotificationStore } from "@/stores";
import { format, addMinutes, parse, isBefore, isAfter } from "date-fns";

interface CreateShowtimeDialogProps {
  open: boolean;
  onClose: () => void;
  cinemaId: string;
  cinemaName: string;
  cinemaBuffer?: number | null;
  rooms: Room[];
  onSuccess: () => void;
}

export function CreateShowtimeDialog({
  open,
  onClose,
  cinemaName,
  cinemaBuffer,
  rooms,
  onSuccess,
}: CreateShowtimeDialogProps) {
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [existingShowtimes, setExistingShowtimes] = useState<
    ShowtimeResponse[]
  >([]);

  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (open) {
      loadMovies();
      resetForm();
      console.log("CreateShowtimeDialog - cinemaBuffer:", cinemaBuffer);
    }
  }, [open, cinemaBuffer]);

  useEffect(() => {
    if (selectedRoomId) {
      loadExistingShowtimes(selectedRoomId);
    } else {
      setExistingShowtimes([]);
    }
  }, [selectedRoomId]);

  // Auto-calculate end time based on movie duration + buffer
  useEffect(() => {
    const selectedMovie = movies.find((m) => m.id === selectedMovieId);
    if (selectedMovie && startTime && selectedMovie.durationMinutes) {
      try {
        const start = parse(startTime, "yyyy-MM-dd'T'HH:mm", new Date());
        if (!isNaN(start.getTime())) {
          const buffer = cinemaBuffer || 0;
          const totalMinutes = selectedMovie.durationMinutes + buffer;
          const end = addMinutes(start, totalMinutes);
          const endTimeStr = format(end, "yyyy-MM-dd'T'HH:mm");
          setEndTime(endTimeStr);
        }
      } catch (error) {
        console.error("Error calculating end time:", error);
      }
    }
  }, [selectedMovieId, startTime, movies, cinemaBuffer]);

  const loadMovies = async () => {
    try {
      const data = await getAllMovies();
      setMovies(data);
    } catch (error) {
      console.error("Failed to load movies:", error);
    }
  };

  const loadExistingShowtimes = async (roomId: string) => {
    try {
      const data = await getShowtimesByRoom(roomId);
      setExistingShowtimes(data);
    } catch (error) {
      console.error("Failed to load existing showtimes:", error);
    }
  };

  const resetForm = () => {
    setSelectedMovieId("");
    setSelectedRoomId("");
    setStartTime("");
    setEndTime("");
  };

  const checkTimeOverlap = (): boolean => {
    if (!startTime || !endTime) return false;

    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    return existingShowtimes.some((showtime) => {
      const existingStart = new Date(showtime.startTime);
      const existingEnd = new Date(showtime.endTime);

      return (
        (isBefore(newStart, existingEnd) && isAfter(newEnd, existingStart)) ||
        (isBefore(existingStart, newEnd) && isAfter(existingEnd, newStart))
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMovieId || !selectedRoomId || !startTime || !endTime) {
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
        title: "Schedule Conflict",
        message: "Showtime conflicts with another showing in this room",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        movieId: selectedMovieId,
        roomId: selectedRoomId,
        startTime: startTime + ":00",
        endTime: endTime + ":00",
      };

      await createShowtime(payload);

      addNotification({
        type: "success",
        title: "Success",
        message: "Showtime created successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Unable to create showtime",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMovie = movies.find((m) => m.id === selectedMovieId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            Create New Showtime
          </DialogTitle>
          <DialogDescription>
            Create a new showtime at cinema: <strong>{cinemaName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cinema (Fixed) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cinema
            </Label>
            <Input
              value={cinemaName}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cinema is fixed based on your selection
            </p>
          </div>

          {/* Movie Selection */}
          <div className="space-y-2">
            <Label htmlFor="movie" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Movie
            </Label>
            <Select value={selectedMovieId} onValueChange={setSelectedMovieId}>
              <SelectTrigger id="movie">
                <SelectValue placeholder="Select movie..." />
              </SelectTrigger>
              <SelectContent>
                {movies.map((movie) => (
                  <SelectItem key={movie.id} value={movie.id}>
                    {movie.title} ({movie.durationMinutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="room" className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Room
            </Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger id="room">
                <SelectValue placeholder="Select room..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} ({room.totalSeats} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Start Time
            </Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cannot select time in the past
            </p>
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              required
            />
            {selectedMovie && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cinemaBuffer !== undefined && cinemaBuffer !== null
                  ? `Auto-calculated: ${selectedMovie.durationMinutes} min (movie) + ${cinemaBuffer} min (buffer)`
                  : `Auto-calculated based on movie duration (${selectedMovie.durationMinutes} min)`}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Showtime"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
