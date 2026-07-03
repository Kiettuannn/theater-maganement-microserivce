import { RoomStatus } from "@/types/RoomType/room";
import { Badge } from "../ui/badge";
import { badgeConfig } from "@/constants/room";

interface RoomStatusBadgeProps {
  status: RoomStatus;
  className?: string;
}

export function RoomStatusBadge({ status }: RoomStatusBadgeProps) {
  const cfg = badgeConfig[status];
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {cfg.text}
    </Badge>
  );
}
