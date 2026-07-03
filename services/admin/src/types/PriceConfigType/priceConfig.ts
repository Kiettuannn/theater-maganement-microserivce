// Enums matching backend - Using const objects instead of enums for better compatibility
export const DayType = {
  WEEKDAY: "WEEKDAY",
  WEEKEND: "WEEKEND",
} as const;

export type DayType = (typeof DayType)[keyof typeof DayType];

export const TimeSlot = {
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
  EVENING: "EVENING",
  LATE_NIGHT: "LATE_NIGHT",
} as const;

export type TimeSlot = (typeof TimeSlot)[keyof typeof TimeSlot];

// Response from backend
export interface PriceConfig {
  id: string;
  dayType: DayType;
  timeSlot: TimeSlot;
  price: number;
  seatTypeName: string;
}

// Request to backend
export interface PriceConfigRequest {
  seatTypeId: string;
  dayType: string;
  timeSlot: string;
  price: number;
}
