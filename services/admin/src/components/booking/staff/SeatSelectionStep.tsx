import type { Seat, Showtime } from "../../../lib/types";
import { useEffect, useState } from "react";

interface SeatSelectionStepProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onSelectSeats: (seats: Seat[]) => void;
  showtime: Showtime & { roomName: string; cinemaName: string };
  loading: boolean;
  error: string | null;
  customerName: string;
  customerEmail: string;
  checkoutMode: "guest" | "member";
  onCustomerNameChange: (value: string) => void;
  onCustomerEmailChange: (value: string) => void;
  onCheckoutModeChange: (mode: "guest" | "member") => void;
}

export default function SeatSelectionStep({
  seats,
  selectedSeats,
  onSelectSeats,
  showtime,
  loading,
  error,
  customerName,
  customerEmail,
  checkoutMode,
  onCustomerNameChange,
  onCustomerEmailChange,
  onCheckoutModeChange,
}: SeatSelectionStepProps) {
  const [groupedByRow, setGroupedByRow] = useState<Record<string, Seat[]>>({});

  const isGuestCheckout = checkoutMode === "guest";

  useEffect(() => {
    const grouped = seats.reduce(
      (acc, seat) => {
        if (!acc[seat.row]) {
          acc[seat.row] = [];
        }
        acc[seat.row].push(seat);
        return acc;
      },
      {} as Record<string, Seat[]>,
    );

    // Sort each row by seat number
    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => a.number - b.number);
    });

    setGroupedByRow(grouped);
  }, [seats]);

  const handleSeatClick = (seat: Seat) => {
    if (!seat.isAvailable) return;

    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    if (isSelected) {
      onSelectSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      onSelectSeats([...selectedSeats, seat]);
    }
  };

  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (!seat.isAvailable) {
      return "bg-red-500 text-white cursor-not-allowed";
    }

    if (isSelected) {
      return "bg-blue-600 text-white shadow-md";
    }

    switch (seat.type) {
      case "vip":
        return "bg-amber-100 text-amber-900 hover:bg-amber-200";
      case "couple":
        return "bg-pink-100 text-pink-800 hover:bg-pink-200";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
    }
  };

  const seatTotal = selectedSeats.reduce(
    (sum, seat) => sum + (seat.price || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading seats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-semibold">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Select Your Seats</p>
          <h2 className="text-2xl font-bold text-gray-900">
            {showtime.cinemaName} • {showtime.roomName}
          </h2>
          <p className="text-sm text-gray-600">
            {new Date(showtime.time).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Selected</span>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="border rounded-2xl bg-white shadow-sm p-4 xl:p-6">
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="inline-block w-4 h-4 rounded border border-gray-300 bg-gray-50" />
              Standard
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="inline-block w-4 h-4 rounded bg-blue-600" />
              Selected
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="inline-block w-4 h-4 rounded bg-red-500" />
              Taken
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="inline-block w-4 h-4 rounded bg-amber-200" />
              VIP
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="inline-block w-4 h-4 rounded bg-pink-200" />
              Couple
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="text-center mb-6">
              <div className="inline-block px-10 py-2 rounded-full bg-slate-200 text-xs font-semibold text-slate-700 tracking-[0.2em] uppercase">
                Screen
              </div>
            </div>

            <div className="flex justify-center pb-4">
              <div className="space-y-4">
                {Object.entries(groupedByRow).map(([row, rowSeats]) => (
                  <div
                    key={row}
                    className="flex items-center gap-3 justify-center"
                  >
                    <div className="w-8 text-center font-bold text-gray-600 text-base">
                      {row}
                    </div>
                    <div className="flex gap-2">
                      {rowSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          className={`h-12 rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center ${
                            seat.type === "couple" ? "w-24" : "w-12"
                          } ${getSeatColor(seat)} ${seat.isAvailable ? "cursor-pointer" : ""}`}
                          disabled={!seat.isAvailable}
                          title={`Seat ${seat.row}${seat.number}`}
                        >
                          {seat.row}
                          {seat.number}
                        </button>
                      ))}
                    </div>
                    <div className="w-8 text-center font-bold text-gray-600 text-base">
                      {row}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-2xl bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Selected Seats
                </p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedSeats.length} seat
                  {selectedSeats.length !== 1 ? "s" : ""}
                </h3>
              </div>
              {selectedSeats.length > 0 && (
                <button
                  onClick={() => onSelectSeats([])}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedSeats.length === 0 ? (
              <p className="text-sm text-gray-500">No seats selected yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedSeats
                  .slice()
                  .sort((a, b) => {
                    if (a.row === b.row) return a.number - b.number;
                    return a.row.localeCompare(b.row);
                  })
                  .map((seat) => (
                    <div
                      key={seat.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {seat.row}
                          {seat.number}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {seat.type || "regular"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800">
                          {(seat.price || 0).toLocaleString()} VND
                        </span>
                        <button
                          onClick={() => handleSeatClick(seat)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Remove seat"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="border-t mt-4 pt-3 flex items-center justify-between text-base">
              <span className="text-gray-700 font-semibold">Subtotal</span>
              <span className="text-xl font-bold text-blue-700">
                {seatTotal.toLocaleString()} VND
              </span>
            </div>
          </div>

          <div className="border rounded-2xl bg-white shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="guest"
                type="radio"
                name="checkoutMode"
                className="h-4 w-4 text-blue-600"
                checked={checkoutMode === "guest"}
                onChange={() => onCheckoutModeChange("guest")}
              />
              <label
                htmlFor="guest"
                className="text-sm font-semibold text-gray-900"
              >
                Guest Checkout
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="member"
                type="radio"
                name="checkoutMode"
                className="h-4 w-4 text-blue-600"
                checked={checkoutMode === "member"}
                onChange={() => onCheckoutModeChange("member")}
              />
              <label htmlFor="member" className="text-sm text-gray-700">
                Member (Get discount & points)
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  value={customerName}
                  disabled={isGuestCheckout}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onChange={(e) => onCustomerEmailChange(e.target.value)}
                  value={customerEmail}
                  disabled={isGuestCheckout}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
