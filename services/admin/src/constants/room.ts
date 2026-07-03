import { RoomStatus } from "@/types/RoomType/room";

export const statusMessage = {
  [RoomStatus.INACTIVE]: "This room is currently inactive and not available for scheduling.",
  [RoomStatus.MAINTENANCE]: "No screening schedule (Under Maintenance)",
  [RoomStatus.ACTIVE]: "No screening schedule available"
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";


export const badgeConfig: Record<
  RoomStatus,
  {
    text: string;
    className: string;
    variant: BadgeVariant;
  }
> = {
  [RoomStatus.ACTIVE]: {
    text: "Active",
    className: "bg-emerald-100 text-emerald-700 border-emerald-300",
    variant: "default",
  },
  [RoomStatus.INACTIVE]: {
    text: "Inactive",
    className: "bg-red-100 text-red-700 border-red-300",
    variant: "secondary",
  },
  [RoomStatus.MAINTENANCE]: {
    text: "Maintenance",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
    variant: "secondary",
  },
};

