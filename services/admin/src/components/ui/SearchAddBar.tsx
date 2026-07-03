import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import React from "react";

interface SearchAddBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  placeholder?: string;
  totalCount: number;
  filteredCount?: number;
  icon?: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  label?: string;
  buttonText: string;
  onAddClick: () => void;
  className?: string;
}

export const SearchAddBar: React.FC<SearchAddBarProps> = ({
  searchQuery,
  setSearchQuery,
  placeholder = "Search...",
  totalCount,
  filteredCount,
  icon,
  label,
  buttonText,
  onAddClick,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center ${className}`}
    >
      <div className="relative w-full sm:w-96">
        {/* Optional icon for search */}
        {icon && React.isValidElement(icon)
          ? React.cloneElement(icon, {
              className:
                "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4",
            })
          : null}
        <Input
          type="text"
          placeholder={
            searchQuery.trim() && filteredCount !== undefined
              ? `Found ${filteredCount} result${filteredCount !== 1 ? "s" : ""}`
              : placeholder
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-sm">
          {icon && React.isValidElement(icon)
            ? React.cloneElement(icon, { className: "w-4 h-4" })
            : icon}
          {searchQuery.trim() && filteredCount !== undefined ? (
            <span>
              Found: {filteredCount} / {totalCount} {label}
            </span>
          ) : (
            <span>
              Total: {totalCount} {label}
            </span>
          )}
        </div>
        <Button onClick={onAddClick} className="gap-2">
          {icon && React.isValidElement(icon)
            ? React.cloneElement(icon, { className: "w-4 h-4" })
            : icon}
          {buttonText}
        </Button>
      </div>
    </div>
  );
};
