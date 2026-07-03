import { Filter, X } from "lucide-react";
import type { Room } from "@/types/RoomType/room";

interface RoomFilterProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  loading?: boolean;
}

export function RoomFilter({
  rooms,
  selectedRoomId,
  onSelectRoom,
  loading = false,
}: RoomFilterProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-gray-200" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Filter className="h-4 w-4" />
        <span>Filter by Room</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* All Rooms Button */}
        <button
          onClick={() => onSelectRoom(null)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedRoomId === null
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Rooms
        </button>

        {/* Individual Room Buttons */}
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedRoomId === room.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {room.name}
            <span className="text-xs opacity-75">
              ({room.totalSeats} ghế)
            </span>
          </button>
        ))}

        {/* Clear Filter */}
        {selectedRoomId !== null && (
          <button
            onClick={() => onSelectRoom(null)}
            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            <X className="h-3 w-3" />
            Clear Filter
          </button>
        )}
      </div>

      {/* Active Filter Summary */}
      {selectedRoomId && (
        <div className="text-sm text-gray-600">
          Showing showtimes for:{" "}
          <span className="font-semibold text-blue-600">
            {rooms.find((r) => r.id === selectedRoomId)?.name}
          </span>
        </div>
      )}
    </div>
  );
}
