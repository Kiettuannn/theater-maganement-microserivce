import type { FilterConfig, FilterOption } from "@/components/ui/FilterBar";
import { RoomStatus, RoomType, type Room } from "@/types/RoomType/room";

// Static filters that don't change
export const staticRoomFilterConfigs: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    placeholder: "Select status",
    options: [
      { value: RoomStatus.ACTIVE, label: "Active" },
      { value: RoomStatus.INACTIVE, label: "Inactive" },
      { value: RoomStatus.MAINTENANCE, label: "Maintenance" },
    ],
  },
  {
    key: "roomType",
    label: "Room Type",
    placeholder: "Select room type",
    options: [
      { value: RoomType.STANDARD, label: "Standard" },
      { value: RoomType.IMAX, label: "IMAX" },
      { value: RoomType.FOUR_DX, label: "4DX" },
      { value: RoomType.GOLD_CLASS, label: "Gold Class" },
    ],
  },
];

// Generate cinema filter options from rooms data
export const getCinemaFilterOptions = (rooms: Room[]): FilterOption[] => {
  const cinemaMap = new Map<string, string>();
  
  rooms.forEach((room) => {
    if (room.cinemaId && room.cinemaName) {
      cinemaMap.set(room.cinemaId, room.cinemaName);
    }
  });

  return Array.from(cinemaMap.entries()).map(([id, name]) => ({
    value: id,
    label: name,
  }));
};

// Generate complete filter configs including dynamic cinema filter
export const getRoomFilterConfigs = (rooms: Room[]): FilterConfig[] => {
  const cinemaOptions = getCinemaFilterOptions(rooms);
  
  return [
    ...staticRoomFilterConfigs,
    {
      key: "cinema",
      label: "Cinema",
      placeholder: "Select cinema",
      options: cinemaOptions,
    },
  ];
};
