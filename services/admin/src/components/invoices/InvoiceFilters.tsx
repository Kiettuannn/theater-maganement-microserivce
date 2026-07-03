import { InvoiceStatus } from "@/types/InvoiceType/invoice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllCinemas } from "@/services/cinemaService";
import type { Cinema } from "@/services/cinemaService";
import { useAuthStore } from "@/stores/useAuthStore";

interface InvoiceFiltersProps {
  onFilter: (filters: {
    search: string;
    status: InvoiceStatus | "ALL";
    cinemaId?: string;
  }) => void;
  disabled?: boolean;
}

export const InvoiceFilters = ({ onFilter, disabled }: InvoiceFiltersProps) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [cinemaId, setCinemaId] = useState<string | "ALL">("ALL");
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [cinemasLoading, setCinemasLoading] = useState(false);

  const userCinemaId = useAuthStore((s) => s.cinemaId);

  // Fetch cinemas for dropdown
  useEffect(() => {
    const fetchCinemas = async () => {
      // Only fetch if user is ADMIN (no cinemaId assigned)
      if (userCinemaId) {
        return;
      }

      try {
        setCinemasLoading(true);
        const data = await getAllCinemas();
        setCinemas(data);
      } catch (error) {
        console.error("Failed to fetch cinemas:", error);
      } finally {
        setCinemasLoading(false);
      }
    };

    fetchCinemas();
  }, [userCinemaId]);

  const handleSearch = () => {
    onFilter({
      search,
      status,
      cinemaId: cinemaId !== "ALL" ? cinemaId : undefined,
    });
  };

  const handleClear = () => {
    setSearch("");
    setStatus("ALL");
    setCinemaId("ALL");
    onFilter({
      search: "",
      status: "ALL",
      cinemaId: undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Check if user is admin (no cinemaId) or manager (has cinemaId)
  const isAdmin = !userCinemaId;

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by Invoice ID or Booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {/* Cinema Filter (only for ADMIN) */}
        {isAdmin && (
          <Select
            value={cinemaId}
            onValueChange={(value) => setCinemaId(value)}
            disabled={disabled || cinemasLoading}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Cinema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Cinemas</SelectItem>
              {cinemas.map((cinema) => (
                <SelectItem key={cinema.id} value={cinema.id}>
                  {cinema.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as InvoiceStatus | "ALL")
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value={InvoiceStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
            <SelectItem value={InvoiceStatus.FAILED}>Failed</SelectItem>
            <SelectItem value={InvoiceStatus.REFUNDED}>Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSearch} disabled={disabled}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={disabled}
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
};
