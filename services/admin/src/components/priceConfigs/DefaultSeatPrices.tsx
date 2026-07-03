import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import type { SeatType } from "@/types/SeatType/seat";
import { updateSeatType } from "@/services/seatTypeService";
import { useNotificationStore } from "@/stores";

interface DefaultSeatPricesProps {
  seatTypes: SeatType[];
  onUpdate: () => void;
}

export function DefaultSeatPrices({ seatTypes, onUpdate }: DefaultSeatPricesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleEdit = (seatType: SeatType) => {
    setEditingId(seatType.id);
    setEditValue(seatType.basePriceModifier.toString());
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSave = async (seatType: SeatType) => {
    setSaving(true);
    try {
      const newPrice = parseFloat(editValue);
      if (isNaN(newPrice) || newPrice < 0) {
        addNotification({
          type: "error",
          title: "Invalid Price",
          message: "Please enter a valid price",
        });
        return;
      }

      await updateSeatType(seatType.id, {
        typeName: seatType.typeName,
        basePriceModifier: newPrice,
      });

      addNotification({
        type: "success",
        title: "Success",
        message: `Updated base price for ${seatType.typeName}`,
      });

      setEditingId(null);
      setEditValue("");
      onUpdate();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.message || "Failed to update base price",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Default Seat Prices</h3>
          <p className="text-sm text-muted-foreground">
            Base prices for each seat type. These are used as reference for time-based pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {seatTypes.map((seatType) => {
            const isEditing = editingId === seatType.id;

            return (
              <div
                key={seatType.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">{seatType.typeName}</div>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 w-32"
                      min="0"
                      step="1000"
                      disabled={saving}
                      autoFocus
                    />
                  ) : (
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(seatType.basePriceModifier)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSave(seatType)}
                        disabled={saving}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={saving}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(seatType)}
                      className="h-8 w-8 p-0"
                      title="Edit base price"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> These are the default/base prices for each seat type. 
            You can configure time-based pricing multipliers below.
          </p>
        </div>
      </div>
    </Card>
  );
}
