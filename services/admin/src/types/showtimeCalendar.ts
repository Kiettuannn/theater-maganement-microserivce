import type { ShowtimeResponse } from "@/services/showtimeService";

/**
 * Types for the new calendar-based showtime interface
 */

// Represents a day in the calendar with its showtimes
export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD format
  showtimes: ShowtimeResponse[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

// Calendar view configuration
export interface CalendarViewConfig {
  currentMonth: Date;
  selectedCinema: string | null;
  selectedRoom: string | null;
}

// Filters for showtime calendar
export interface ShowtimeCalendarFilters {
  cinemaId: string | null;
  roomId: string | null;
  month: Date;
}

// Grouped showtimes by date
export interface GroupedShowtimes {
  [dateString: string]: ShowtimeResponse[];
}
