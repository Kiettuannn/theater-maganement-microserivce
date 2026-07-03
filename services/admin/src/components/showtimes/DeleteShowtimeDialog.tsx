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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, AlertTriangle, Calendar } from "lucide-react";
import {
  deleteShowtime,
  type ShowtimeResponse,
} from "@/services/showtimeService";
import { useNotificationStore } from "@/stores";
import { format } from "date-fns";

interface DeleteShowtimeDialogProps {
  open: boolean;
  onClose: () => void;
  cinemaName: string;
  showtimes: ShowtimeResponse[];
  onSuccess: () => void;
}

export function DeleteShowtimeDialog({
  open,
  onClose,
  cinemaName,
  showtimes,
  onSuccess,
}: DeleteShowtimeDialogProps) {
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [loading, setLoading] = useState(false);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");

  // Filter only SCHEDULED showtimes (backend will validate if screeningSeats are sold)
  const scheduledShowtimes = showtimes.filter((s) => s.status === "SCHEDULED");

  useEffect(() => {
    if (open) {
      setSelectedShowtimeId("");
    }
  }, [open]);

  const handleDelete = async () => {
    if (!selectedShowtimeId) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please select a showtime to delete",
      });
      return;
    }

    try {
      setLoading(true);

      await deleteShowtime(selectedShowtimeId);

      addNotification({
        type: "success",
        title: "Success",
        message: "Showtime deleted successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Unable to delete showtime";
      
      addNotification({
        type: "error",
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedShowtime = scheduledShowtimes.find((s) => s.id === selectedShowtimeId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Delete Showtime
          </DialogTitle>
          <DialogDescription>
            Delete showtime at cinema: <strong>{cinemaName}</strong>
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
          <div className="space-y-6">
            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20 dark:border dark:border-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-semibold">Warning:</p>
                <p className="mt-1">
                  Only showtimes with no sold tickets can be deleted. If tickets have been sold,
                  the system will reject the deletion.
                </p>
              </div>
            </div>

            {/* Showtime Selection */}
            <div className="space-y-2">
              <Label htmlFor="showtime">Select showtime to delete</Label>
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

            {/* Selected Showtime Info */}
            {selectedShowtime && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                  Showtime to be deleted:
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Movie:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedShowtime.movieName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Room:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedShowtime.roomName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(selectedShowtime.startTime), "MM/dd/yyyy HH:mm")} -{" "}
                      {format(new Date(selectedShowtime.endTime), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {selectedShowtime.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || !selectedShowtimeId}
              >
                {loading ? "Deleting..." : "Delete Showtime"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
