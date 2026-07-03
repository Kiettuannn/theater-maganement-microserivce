import { RoomCard } from "@/components/rooms";
import { useRoomManager } from "@/hooks/useRoomManager";
import type { Room } from "@/types/RoomType/room";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { Monitor } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FilterBar } from "@/components/ui/FilterBar";
import { useFilter } from "@/hooks/useFilter";
import { getRoomFilterConfigs } from "@/constants/roomFilters";

export function RoomList() {
  const { rooms, loadData, loading } = useRoomManager();
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [loadData]);

  console.log("Rooms:", rooms);

  // Generate filter configs with dynamic cinema options
  const filterConfigs = useMemo(() => getRoomFilterConfigs(rooms), [rooms]);

  // Filter functions for each filter type
  const filterFunctions = useMemo(
    () => ({
      status: (room: Room, value: string) => room.status === value,
      roomType: (room: Room, value: string) => room.roomType === value,
      cinema: (room: Room, value: string) => room.cinemaId === value,
    }),
    [],
  );

  const { activeFilters, filteredData, handleFilterChange, clearFilters } =
    useFilter({
      data: rooms,
      filterFunctions,
    });

  const handleEdit = (room: Room) => {
    navigate(ROUTES.ROOMS_EDIT.replace(":id", room.id.toString()));
  };

  const handleViewSchedule = (room: Room) => {
    navigate(`${ROUTES.SHOWTIMES}?roomId=${room.id}`);
  };

  const handleAddRoom = () => {
    navigate(ROUTES.ROOMS_CREATE);
  };

  // Apply search query on top of filtered data
  const filteredRooms = filteredData.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms Management"
        description="Manage your theater rooms here."
      />

      {/* Search and Actions Bar */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search by room name..."
        totalCount={rooms.length}
        filteredCount={filteredRooms.length}
        icon={<Monitor className="w-4 h-4" />}
        label="rooms"
        buttonText="Add Room"
        onAddClick={handleAddRoom}
      />
      {/* Filter Bar */}
      <FilterBar
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Rooms Grid */}
      <div>
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <LoadingSpinner
              message="Loading rooms..."
              size="lg"
              fullScreen={false}
            />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={handleEdit}
                onViewSchedule={handleViewSchedule}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
