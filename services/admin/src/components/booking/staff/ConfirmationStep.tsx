import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Seat, ComboItem, Showtime } from "../../../lib/types";
import type { MovieSimple } from "@/services/movieService";
import { format } from "date-fns";

interface ConfirmationStepProps {
  selectedSeats: Seat[];
  selectedCombos: ComboItem[];
  showtime: Showtime & { roomName: string; cinemaName: string };
  movie: MovieSimple;
  subtotal: number;
  customerPoints: number;
  pointsUsed: number;
  pointsDiscount: number;
  onApplyPoints: (points: number) => void;
}

export default function ConfirmationStep({
  selectedSeats,
  selectedCombos,
  showtime,
  movie,
  subtotal,
  customerPoints,
  pointsUsed,
  pointsDiscount,
  onApplyPoints,
}: ConfirmationStepProps) {
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const points = parseInt(e.target.value) || 0;
    onApplyPoints(points);
  };

  const total = Math.max(0, subtotal - pointsDiscount);
  const maxRedeemablePoints = Math.min(
    customerPoints,
    Math.floor((subtotal * 0.5) / 1000),
    Math.floor(subtotal / 1000),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Confirm Booking</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking Details */}
        <div className="space-y-4">
          {/* Showtime Info */}
          <Card className="p-4">
            <h3 className="font-bold mb-3">Showtime Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Movie</p>
                <p className="font-semibold">{movie.title}</p>
              </div>
              <div>
                <p className="text-gray-600">Time</p>
                <p className="font-semibold">
                  {format(new Date(showtime.time), "PPp")}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Room</p>
                <p className="font-semibold">{showtime.roomName}</p>
              </div>
              <div>
                <p className="text-gray-600">Cinema</p>
                <p className="font-semibold">{showtime.cinemaName}</p>
              </div>
            </div>
          </Card>

          {/* Seats */}
          <Card className="p-4">
            <h3 className="font-bold mb-3">
              Selected Seats ({selectedSeats.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedSeats
                .sort((a, b) => {
                  if (a.row === b.row) {
                    return a.number - b.number;
                  }
                  return a.row.localeCompare(b.row);
                })
                .map((seat) => (
                  <span
                    key={seat.id}
                    className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold"
                  >
                    {seat.row}
                    {seat.number}
                  </span>
                ))}
            </div>
          </Card>

          {/* Combos */}
          {selectedCombos.length > 0 && (
            <Card className="p-4">
              <h3 className="font-bold mb-3">Selected Combos</h3>
              <div className="space-y-2">
                {selectedCombos.map((combo) => (
                  <div key={combo.id} className="flex justify-between text-sm">
                    <span>
                      {combo.name} × {combo.quantity}
                    </span>
                    <span className="font-semibold">
                      {(combo.price * (combo.quantity || 1)).toLocaleString()}{" "}
                      VND
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Summary & Loyalty Points */}
        <div className="space-y-4">
          {/* Price Summary */}
          <Card className="p-4">
            <h3 className="font-bold mb-4">Price Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Seats</span>
                <span className="font-semibold">
                  {selectedSeats
                    .reduce((sum, s) => sum + (s.price || 0), 0)
                    .toLocaleString()}{" "}
                  VND
                </span>
              </div>
              {selectedCombos.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Combos</span>
                  <span className="font-semibold">
                    {selectedCombos
                      .reduce((sum, c) => sum + c.price * (c.quantity || 1), 0)
                      .toLocaleString()}{" "}
                    VND
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold">
                  {subtotal.toLocaleString()} VND
                </span>
              </div>
            </div>
          </Card>

          {/* Loyalty Points */}
          <Card className="p-4">
            <h3 className="font-bold mb-3">Loyalty Points</h3>
            <p className="text-sm text-gray-600 mb-3">
              Available: {customerPoints.toLocaleString()} points
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">
                  Points to redeem
                </label>
                <Input
                  type="number"
                  min="0"
                  max={maxRedeemablePoints}
                  value={pointsUsed}
                  onChange={handlePointsChange}
                  className="mt-1"
                  placeholder="0"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Max: {maxRedeemablePoints.toLocaleString()} points (50% of
                  total)
                </p>
              </div>
              {pointsDiscount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-sm text-green-700">
                    Discount: {pointsDiscount.toLocaleString()} VND
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Total */}
          <Card className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="space-y-2">
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-sm opacity-90">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString()} VND</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-sm opacity-90">
                  <span>Discount</span>
                  <span>-{pointsDiscount.toLocaleString()} VND</span>
                </div>
              )}
              <div className="border-t border-white/30 pt-2 flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold">
                  {total.toLocaleString()} VND
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
