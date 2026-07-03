import { DayType, TimeSlot } from "@/types/PriceConfigType/priceConfig";

// Seat type options for select
export const SEAT_TYPE_OPTIONS = [
  { value: "STANDARD", label: "Standard" },
  { value: "COUPLE", label: "Couple" },
  { value: "VIP", label: "VIP" },
];

// Day type options for select
export const DAY_TYPE_OPTIONS = [
  { value: DayType.WEEKDAY, label: "Weekday" },
  { value: DayType.WEEKEND, label: "Weekend" },
];

// Time slot options for select
export const TIME_SLOT_OPTIONS = [
  { value: TimeSlot.MORNING, label: "Morning (06:00 - 12:00)" },
  { value: TimeSlot.AFTERNOON, label: "Afternoon (12:00 - 18:00)" },
  { value: TimeSlot.EVENING, label: "Evening (18:00 - 23:00)" },
  { value: TimeSlot.LATE_NIGHT, label: "Late Night (23:00 - 06:00)" },
];

// Helper functions
export const getSeatTypeLabel = (seatType: string): string => {
  return SEAT_TYPE_OPTIONS.find((opt) => opt.value === seatType)?.label || seatType;
};

export const getDayTypeLabel = (dayType: DayType): string => {
  return DAY_TYPE_OPTIONS.find((opt) => opt.value === dayType)?.label || dayType;
};

export const getTimeSlotLabel = (timeSlot: TimeSlot): string => {
  return TIME_SLOT_OPTIONS.find((opt) => opt.value === timeSlot)?.label || timeSlot;
};
