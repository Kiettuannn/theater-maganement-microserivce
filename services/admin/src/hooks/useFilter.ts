import { useState, useMemo, useCallback } from "react";

export interface UseFilterOptions<T> {
  data: T[];
  filterFunctions: Record<string, (item: T, filterValue: string) => boolean>;
}

export function useFilter<T>({ data, filterFunctions }: UseFilterOptions<T>) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleFilterChange = useCallback((key: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(activeFilters).every(([key, value]) => {
        // Skip if filter value is "all" or empty
        if (value === "all" || value === "") return true;
        
        // Apply the filter function for this key
        const filterFn = filterFunctions[key];
        if (!filterFn) return true;
        
        return filterFn(item, value);
      });
    });
  }, [data, activeFilters, filterFunctions]);

  return {
    activeFilters,
    filteredData,
    handleFilterChange,
    clearFilters,
  };
}
