import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddRoomButtonProps {
  onClick?: () => void;
}

export function AddRoomButton({ onClick }: AddRoomButtonProps) {
  return (
    <Button onClick={onClick} className="gap-2">
      <Plus className="h-4 w-4" />
      Add Room
    </Button>
  );
}
