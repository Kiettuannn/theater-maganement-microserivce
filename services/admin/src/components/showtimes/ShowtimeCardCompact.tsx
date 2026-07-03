import { Clock, Film } from "lucide-react";
import { format } from "date-fns";
import type { ShowtimeResponse } from "@/services/showtimeService";

interface ShowtimeCardCompactProps {
  showtime: ShowtimeResponse;
  onClick: () => void;
}

export function ShowtimeCardCompact({ showtime, onClick }: ShowtimeCardCompactProps) {
  const startTime = new Date(showtime.startTime);

  // Status color mapping
  const statusColors = {
    SCHEDULED: "bg-blue-100 border-blue-300 hover:bg-blue-200",
    ONGOING: "bg-green-100 border-green-300 hover:bg-green-200",
    COMPLETED: "bg-gray-100 border-gray-300 hover:bg-gray-200",
  };

  const statusColor = statusColors[showtime.status] || statusColors.SCHEDULED;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-md border p-2 text-left text-xs transition-colors ${statusColor}`}
    >
      <div className="flex items-center gap-1 text-gray-900">
        <Clock className="h-3 w-3 shrink-0" />
        <span className="font-semibold">{format(startTime, "HH:mm")}</span>
      </div>
      <div className="mt-1 flex items-start gap-1">
        <Film className="mt-0.5 h-3 w-3 shrink-0 text-gray-700" />
        <p className="line-clamp-2 text-gray-800">{showtime.movieName}</p>
      </div>
      <p className="mt-1 truncate text-gray-600">{showtime.roomName}</p>
    </button>
  );
}
