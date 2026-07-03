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
import { Film, Clock, DoorOpen, Calendar } from "lucide-react";
import { getAllMovies } from "@/services/movieService";
import type { MovieSimple } from "@/types/MovieType/Movie";
import type { Room } from "@/types/RoomType/room";
import {
  getShowtimesByRoom,
  updateShowtime,
  type ShowtimeResponse,
} from "@/services/showtimeService";
import { useNotificationStore } from "@/stores";
import { format, addMinutes, parse, isBefore, isAfter } from "date-fns";

interface EditShowtimeDialogProps {
  open: boolean;
  onClose: () => void;
  cinemaName: string;
  cinemaBuffer?: number | null;
  rooms: Room[];
  showtimes: ShowtimeResponse[];
  onSuccess: () => void;
}

export function EditShowtimeDialog({
  open,
  onClose,
  cinemaName,
  cinemaBuffer,
  rooms,
  showtimes,
  onSuccess,
}: EditShowtimeDialogProps) {
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [existingShowtimes, setExistingShowtimes] = useState<ShowtimeResponse[]>([]);

  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoadingShowtime, setIsLoadingShowtime] = useState(false);

  // Filter only SCHEDULED showtimes
  const scheduledShowtimes = showtimes.filter((s) => s.status === "SCHEDULED");

  useEffect(() => {
    if (open) {
      loadMovies();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (selectedRoomId) {
      loadExistingShowtimes(selectedRoomId);
    } else {
      setExistingShowtimes([]);
    }
  }, [selectedRoomId]);

  // Load showtime details when selected (only on initial selection)
  useEffect(() => {
    if (selectedShowtimeId) {
      setIsLoadingShowtime(true);
      const showtime = scheduledShowtimes.find((s) => s.id === selectedShowtimeId);
      if (showtime) {
        setSelectedMovieId(showtime.movieId);
        setSelectedRoomId(showtime.roomId);
        setStartTime(format(new Date(showtime.startTime), "yyyy-MM-dd'T'HH:mm"));
        setEndTime(format(new Date(showtime.endTime), "yyyy-MM-dd'T'HH:mm"));
      }
      // Delay to prevent auto-calculate from overriding
      setTimeout(() => setIsLoadingShowtime(false), 100);
    }
    // Only run when selectedShowtimeId changes, not when scheduledShowtimes changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShowtimeId]);

  // Auto-calculate end time based on movie duration + buffer (with 1s delay)
  useEffect(() => {
    if (isLoadingShowtime) return; // Don't auto-calculate when loading showtime data
    
    const selectedMovie = movies.find((m) => m.id === selectedMovieId);
    if (selectedMovie && startTime && selectedMovie.durationMinutes) {
      // Delay 1 second to allow user to finish selecting date/time
      const debounceTimer = setTimeout(() => {
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
      }, 1000); // 1 second delay

      return () => clearTimeout(debounceTimer);
    }
  }, [selectedMovieId, startTime, movies, isLoadingShowtime, cinemaBuffer]);

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
    setSelectedShowtimeId("");
    setSelectedMovieId("");
    setSelectedRoomId("");
    setStartTime("");
    setEndTime("");
    setIsLoadingShowtime(false);
  };

  const checkTimeOverlap = (): boolean => {
    if (!startTime || !endTime || !selectedShowtimeId) return false;

    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    return existingShowtimes.some((showtime) => {
      // Skip checking against itself
      if (showtime.id === selectedShowtimeId) return false;

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

    if (!selectedShowtimeId || !selectedMovieId || !selectedRoomId || !startTime || !endTime) {
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

      await updateShowtime(selectedShowtimeId, payload);

      addNotification({
        type: "success",
        title: "Success",
        message: "Showtime updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Unable to update showtime",
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
          <DialogTitle className="dark:text-gray-100">Edit Showtime</DialogTitle>
          <DialogDescription>
            Edit scheduled showtime at cinema: <strong>{cinemaName}</strong>
            <br />
            <span className="text-xs">Note: You can only update start time. Movie and room are fixed.</span>
          </DialogDescription>
        </DialogHeader>

        {scheduledShowtimes.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              No showtimes with SCHEDULED status
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Showtime Selection */}
            <div className="space-y-2">
              <Label htmlFor="showtime">Select showtime to edit</Label>
              <Select value={selectedShowtimeId} onValueChange={setSelectedShowtimeId}>
                <SelectTrigger id="showtime">
                  <SelectValue placeholder="Select showtime..." />
                </SelectTrigger>
                <SelectContent>
                  {scheduledShowtimes.map((showtime) => (
                    <SelectItem key={showtime.id} value={showtime.id}>
                      {showtime.movieName} - {showtime.roomName} -{" "}
                      {format(new Date(showtime.startTime), "MM/dd/yyyy HH:mm")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedShowtimeId && (
              <>
                {/* Movie (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="movie" className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    Movie
                  </Label>
                  <Input
                    id="movie"
                    value={selectedMovie ? `${selectedMovie.title} (${selectedMovie.durationMinutes} min)` : ""}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Movie cannot be changed when editing showtime
                  </p>
                </div>

                {/* Room (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="room" className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4" />
                    Room
                  </Label>
                  <Input
                    id="room"
                    value={rooms.find(r => r.id === selectedRoomId)?.name || ""}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Room cannot be changed when editing showtime
                  </p>
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
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                  {selectedMovie && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cinemaBuffer !== undefined && cinemaBuffer !== null
                        ? `Auto-calculated: ${selectedMovie.durationMinutes} min (movie) + ${cinemaBuffer} min (buffer)`
                        : `Auto-calculated: Start time + ${selectedMovie.durationMinutes} minutes`
                      }
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
