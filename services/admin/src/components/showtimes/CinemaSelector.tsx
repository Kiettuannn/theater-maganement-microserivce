import { MapPin, Users } from "lucide-react";
import type { Cinema } from "@/types/CinemaType/cinemaType";

interface CinemaSelectorProps {
  cinemas: Cinema[];
  selectedCinemaId: string | null;
  onSelectCinema: (cinemaId: string) => void;
  loading?: boolean;
}

export function CinemaSelector({
  cinemas,
  selectedCinemaId,
  onSelectCinema,
  loading = false,
}: CinemaSelectorProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (cinemas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No Cinemas Available
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          There are currently no cinemas in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Select Cinema
        </h2>
        <p className="text-sm text-gray-500">
          {cinemas.length} cinemas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cinemas.map((cinema) => (
          <button
            key={cinema.id}
            onClick={() => onSelectCinema(cinema.id)}
            className={`group relative overflow-hidden rounded-lg border-2 p-6 text-left transition-all ${
              selectedCinemaId === cinema.id
                ? "border-blue-500 bg-blue-50 shadow-lg"
                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
            }`}
          >
            {/* Cinema Name */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {cinema.name}
              </h3>
            </div>

            {/* Location */}
            <div className="mb-2 flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p>{cinema.address}</p>
                <p className="text-gray-500">{cinema.city}</p>
              </div>
            </div>

            {/* Manager Info */}
            {cinema.managerName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 shrink-0" />
                <p>Manager: {cinema.managerName}</p>
              </div>
            )}

            {/* Selected Indicator */}
            {selectedCinemaId === cinema.id && (
              <div className="absolute right-4 top-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
