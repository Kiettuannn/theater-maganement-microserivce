import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface PermissionStatsProps {
  rolesCount: number;
  permissionsCount: number;
  onSync: () => void;
  isSyncing: boolean;
}

export function PermissionStats({
  rolesCount,
  permissionsCount,
  onSync,
  isSyncing,
}: PermissionStatsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold">{rolesCount}</span> roles ·{" "}
        <span className="font-semibold">{permissionsCount}</span> permissions
      </div>
      <Button size="sm" variant="outline" onClick={onSync} disabled={isSyncing}>
        <RefreshCw
          className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")}
        />
        {isSyncing ? "Syncing..." : "Sync"}
      </Button>
    </div>
  );
}
