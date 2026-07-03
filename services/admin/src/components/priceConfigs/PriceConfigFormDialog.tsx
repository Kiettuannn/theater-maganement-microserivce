import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  PriceConfig,
  PriceConfigRequest,
  DayType,
  TimeSlot,
} from "@/types/PriceConfigType/priceConfig";
import type { SeatType } from "@/types/SeatType/seat";
import {
  SEAT_TYPE_OPTIONS,
  DAY_TYPE_OPTIONS,
  TIME_SLOT_OPTIONS,
} from "@/constants/priceConfig";

interface PriceConfigFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    priceConfigId: string | null,
    request: PriceConfigRequest
  ) => Promise<boolean>;
  priceConfig?: PriceConfig | null;
  seatTypes: SeatType[];
  saving?: boolean;
}

interface FormData {
  seatTypeId: string;
  seatTypeName: string;
  dayType: DayType;
  timeSlot: TimeSlot;
  price: string;
}

export function PriceConfigFormDialog({
  isOpen,
  onClose,
  onSubmit,
  priceConfig,
  seatTypes,
  saving = false,
}: PriceConfigFormDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    seatTypeId: "",
    seatTypeName: SEAT_TYPE_OPTIONS[0].value,
    dayType: DAY_TYPE_OPTIONS[0].value,
    timeSlot: TIME_SLOT_OPTIONS[0].value,
    price: "",
  });

  useEffect(() => {
    if (priceConfig) {
      // Find seatTypeId from seatTypeName
      const seatType = seatTypes.find(
        (st) => st.typeName === priceConfig.seatTypeName
      );
      setFormData({
        seatTypeId: seatType?.id || "",
        seatTypeName: priceConfig.seatTypeName,
        dayType: priceConfig.dayType,
        timeSlot: priceConfig.timeSlot,
        price: priceConfig.price.toString(),
      });
    } else {
      // Reset form for new price config
      const firstSeatType = seatTypes[0];
      setFormData({
        seatTypeId: firstSeatType?.id || "",
        seatTypeName: firstSeatType?.typeName || SEAT_TYPE_OPTIONS[0].value,
        dayType: DAY_TYPE_OPTIONS[0].value,
        timeSlot: TIME_SLOT_OPTIONS[0].value,
        price: "",
      });
    }
  }, [priceConfig, isOpen, seatTypes]);

  const handleSeatTypeChange = (seatTypeName: string) => {
    const seatType = seatTypes.find((st) => st.typeName === seatTypeName);
    if (seatType) {
      setFormData({
        ...formData,
        seatTypeId: seatType.id,
        seatTypeName: seatType.typeName,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.seatTypeId) {
      return;
    }

    const request: PriceConfigRequest = {
      seatTypeId: formData.seatTypeId,
      dayType: formData.dayType,
      timeSlot: formData.timeSlot,
      price: parseFloat(formData.price),
    };

    const success = await onSubmit(priceConfig?.id || null, request);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={priceConfig ? "Edit Price Configuration" : "Create Price Configuration"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Seat Type Select */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Seat Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.seatTypeName}
              onValueChange={handleSeatTypeChange}
              disabled={!!priceConfig || saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select seat type" />
              </SelectTrigger>
              <SelectContent>
                {SEAT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Type Select */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Day Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.dayType}
              onValueChange={(value) =>
                setFormData({ ...formData, dayType: value as DayType })
              }
              disabled={!!priceConfig || saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day type" />
              </SelectTrigger>
              <SelectContent>
                {DAY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Slot Select */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Time Slot <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.timeSlot}
              onValueChange={(value) =>
                setFormData({ ...formData, timeSlot: value as TimeSlot })
              }
              disabled={!!priceConfig || saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Price (VND) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="e.g., 50000"
              required
              disabled={saving}
              min="0"
              step="1000"
            />
          </div>

          {/* Info message */}
          {!priceConfig && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> If this combination already exists, the price will be updated instead of creating a new entry.
              </p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? (priceConfig ? "Updating..." : "Creating...")
              : (priceConfig ? "Update" : "Create")
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}
