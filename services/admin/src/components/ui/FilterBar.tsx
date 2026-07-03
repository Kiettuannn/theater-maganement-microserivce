import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  showClearButton?: boolean;
}

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  showClearButton = true,
}: FilterBarProps) {
  const hasActiveFilters = Object.values(activeFilters).some(
    (value) => value !== "all" && value !== ""
  );

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span>Filters:</span>
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={activeFilters[filter.key] || "all"}
          onValueChange={(value) => onFilterChange(filter.key, value)}
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder={filter.placeholder || filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {showClearButton && hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground hover:bg-accent ml-auto"
        >
          <X className="w-4 h-4 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
