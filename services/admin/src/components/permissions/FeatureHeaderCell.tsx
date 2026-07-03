import { cn } from "@/utils/cn";
import type { LucideIcon } from "lucide-react";

interface FeatureHeaderCellProps {
  label: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export function FeatureHeaderCell({
  label,
  icon: Icon,
  iconColor,
  iconBgColor,
}: FeatureHeaderCellProps) {
  return (
    <td className="border-b border-border p-3 font-semibold sticky left-0 z-10 bg-accent/30">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded", iconBgColor)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <span>{label}</span>
      </div>
    </td>
  );
}
