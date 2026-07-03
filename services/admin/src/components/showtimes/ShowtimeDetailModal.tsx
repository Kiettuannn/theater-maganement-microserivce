import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Film, MapPin, Clock, Calendar, DoorOpen } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useState, useEffect } from "react";
import {
  getShowtimeDetail,
  type ShowtimeDetailResponse,
} from "@/services/showtimeService";
import { useNotificationStore } from "@/stores";

interface ShowtimeDetailModalProps {
  showtimeId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ShowtimeDetailModal({
  showtimeId,
  open,
  onClose,
}: ShowtimeDetailModalProps) {
  const [showtime, setShowtime] = useState<ShowtimeDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  useEffect(() => {
    if (open && showtimeId) {
      loadShowtimeDetail();
    }
  }, [open, showtimeId]);

  const loadShowtimeDetail = async () => {
    if (!showtimeId) return;

    try {
      setLoading(true);
      const data = await getShowtimeDetail(showtimeId);
      console.log("Showtime detail loaded:", data);
      setShowtime(data);
    } catch (error) {
      console.error("Failed to load showtime detail:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to load showtime details",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Showtime Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : showtime ? (
          (() => {
            const startTime = new Date(showtime.startTime);
            const endTime = new Date(showtime.endTime);
            const duration = Math.round(
              (endTime.getTime() - startTime.getTime()) / (1000 * 60),
            );

            // Status display
            const statusConfig = {
              SCHEDULED: {
                label: "Scheduled",
                color: "bg-blue-100 text-blue-700",
              },
              ONGOING: {
                label: "Ongoing",
                color: "bg-green-100 text-green-700",
              },
              COMPLETED: {
                label: "Completed",
                color: "bg-gray-100 text-gray-600",
              },
            };

            const status =
              statusConfig[showtime.status as keyof typeof statusConfig] ||
              statusConfig.SCHEDULED;

            return (
              <div className="space-y-6">
                {/* Movie Title */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {showtime.movieName}
                  </h3>
                  <Badge className={`mt-2 ${status.color}`}>
                    {status.label}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Cinema */}
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Cinema
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {showtime.cinemaName}
                      </p>
                    </div>
                  </div>

                  {/* Room */}
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <DoorOpen className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Room</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {showtime.roomName}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Date</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {format(startTime, "EEEE, dd/MM/yyyy", { locale: vi })}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Time</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {format(startTime, "HH:mm")} -{" "}
                        {format(endTime, "HH:mm")}
                      </p>
                      <p className="text-sm text-gray-500">
                        ({duration} minutes)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <h4 className="mb-4 text-lg font-semibold text-foreground">
                    Ticket Information
                  </h4>
                  <div className="grid gap-4">
                    {/* Total Seats */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                      <span className="font-medium text-foreground">
                        Total Seats
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        {showtime.totalSeats}
                      </span>
                    </div>

                    {/* Booked Seats */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                      <span className="font-medium text-foreground">
                        Tickets Sold
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {showtime.bookedSeats}
                      </span>
                    </div>

                    {/* Available Seats */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                      <span className="font-medium text-foreground">
                        Available Seats
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {showtime.availableSeats}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
