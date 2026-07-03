import { cn } from "@/utils/cn";

interface FeaturePermissionToggleProps {
  /**
   * Whether all permissions for this feature are enabled
   */
  allEnabled: boolean;
  /**
   * Whether the checkbox is currently being updated
   */
  isUpdating: boolean;
  /**
   * Callback when the checkbox is toggled
   */
  onToggle: (enable: boolean) => void;
  /**
   * Optional custom label (default: "All")
   */
  label?: string;
}

export function FeaturePermissionToggle({
  allEnabled,
  isUpdating,
  onToggle,
  label = "All",
}: FeaturePermissionToggleProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 hover:bg-background/80 transition-colors border border-border/50">
        <input
          type="checkbox"
          checked={allEnabled}
          disabled={isUpdating}
          onChange={() => onToggle(!allEnabled)}
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all",
            isUpdating && "opacity-50 cursor-not-allowed animate-pulse"
          )}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
