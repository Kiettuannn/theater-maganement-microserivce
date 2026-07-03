import type { SeatType, SeatLayout } from "@/types/SeatType/seat";
import { Sofa, Crown, Heart, Check } from "lucide-react";
import { Label } from "../ui";
import { getRowLetter } from "@/utils/seatUtils";
import { Button } from "../ui/button";
import { cn } from "@/utils/cn";

interface SeatLayoutEditorProps {
  layout: SeatLayout;
  seatTypes: SeatType[];
  selectedTypeId: string;
  onSeatClick: (seatId: string) => void;
  onTypeChange: (typeId: string) => void;
}

export function SeatLayoutEditor({
  layout,
  seatTypes,
  selectedTypeId,
  onSeatClick,
  onTypeChange,
}: SeatLayoutEditorProps) {
  const getSeatVisuals = (typeName: string = "") => {
    const normalizedType = typeName.toUpperCase();
    switch (normalizedType) {
      case "VIP":
        return {
          icon: <Crown className="h-3 w-3 sm:h-4 sm:w-4" />,
          colorClass: "bg-yellow-500 hover:bg-yellow-600 border-yellow-600",
          lightBg: "bg-yellow-50 text-yellow-700",
          widthClass: "w-8 sm:w-10",
        };
      case "COUPLE":
        return {
          icon: <Heart className="h-3 w-3 sm:h-4 sm:w-4" />,
          colorClass: "bg-pink-500 hover:bg-pink-600 border-pink-600",
          lightBg: "bg-pink-50 text-pink-700",
          widthClass: "w-14 sm:w-16",
        };
      default:
        return {
          icon: <Sofa className="h-3 w-3 sm:h-4 sm:w-4" />,
          colorClass: "bg-blue-500 hover:bg-blue-600 border-blue-600",
          lightBg: "bg-blue-50 text-blue-700",
          widthClass: "w-8 sm:w-10",
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Seat Type to Apply</Label>
        <div className="flex gap-2">
          {seatTypes.map((type) => {
            const visual = getSeatVisuals(type.typeName);
            const isSelected = selectedTypeId === type.id;
            return (
              <Button
                key={type.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                onClick={() => onTypeChange(type.id)}
                className={cn(
                  "relative flex items-center gap-2 transition-all",
                  isSelected
                    ? `ring-2 ring-offset-2 ring-gray-400 ${visual.colorClass} border-transparent text-white`
                    : "hover:bg-gray-50",
                )}
              >
                {visual.icon}
                <span>{type.typeName}</span>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Seat Layout Display */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <div className="text-center mb-6">
          <div className="bg-gray-800 text-white py-3 px-8 rounded-lg inline-block text-lg font-semibold">
            SCREEN
          </div>
        </div>

        <div className="flex justify-center">
          <div className="space-y-3 max-h-96 overflow-auto p-4">
            {Array.from({ length: layout.rows }, (_, rowIndex) => {
              const rowLetter = getRowLetter(rowIndex);
              return (
                <div key={rowIndex} className="flex items-center gap-3">
                  <span className="w-10 text-center font-bold text-lg text-gray-700">
                    {rowLetter}
                  </span>
                  <div className="flex gap-2 justify-center">
                    {Array.from(
                      { length: layout.seatsPerRow },
                      (_, seatIndex) => {
                        const seatId = `${rowLetter}${seatIndex + 1}`;
                        const seat = layout.seats.find((s) => s.id === seatId);
                        const currentTypeObj = seatTypes.find(
                          (t) => t.id === seat?.seatTypeId,
                        );
                        const typeName = currentTypeObj
                          ? currentTypeObj.typeName
                          : "STANDARD";
                        const visual = getSeatVisuals(typeName);

                        return (
                          <button
                            key={seatIndex}
                            type="button"
                            onClick={() => onSeatClick(seatId)}
                            className={cn(
                              "h-9 sm:h-10 rounded-t-lg sm:rounded-lg flex flex-col items-center justify-center text-white shadow-sm transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md active:scale-95",
                              visual.widthClass,
                              visual.colorClass,
                            )}
                            title={`${seatId} - ${typeName}`}
                          >
                            <div className="opacity-90 scale-90 sm:scale-100">
                              {visual.icon}
                            </div>
                            <span className="text-[10px] leading-none mt-0.5 font-medium opacity-80">
                              {seatIndex + 1}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-3 font-medium">
            Summary ({layout.seats.length} seats total)
          </p>

          <div className="flex flex-wrap gap-4">
            {seatTypes.map((type) => {
              const visual = getSeatVisuals(type.typeName);
              // Đếm số ghế thuộc loại này trong layout hiện tại
              const count = layout.seats.filter(
                (s) => s.seatTypeId === type.id,
              ).length;

              return (
                <div
                  key={type.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg border",
                    visual.lightBg,
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-md text-white shadow-sm",
                      visual.colorClass,
                    )}
                  >
                    {visual.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase opacity-70">
                      {type.typeName}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
