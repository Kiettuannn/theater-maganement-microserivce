import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShowtimeCardCompact } from "./ShowtimeCardCompact";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { vi } from "date-fns/locale";
import type { ShowtimeResponse } from "@/services/showtimeService";
import type { CalendarDay } from "@/types/showtimeCalendar";

interface ShowtimeCalendarProps {
  showtimes: ShowtimeResponse[];
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  onShowtimeClick: (showtime: ShowtimeResponse) => void;
  loading?: boolean;
}

export function ShowtimeCalendar({
  showtimes,
  currentMonth,
  onMonthChange,
  onShowtimeClick,
  loading = false,
}: ShowtimeCalendarProps) {
  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: CalendarDay[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const dateString = format(day, "yyyy-MM-dd");
      const dayShowtimes = showtimes.filter((showtime) => {
        const showtimeDate = format(new Date(showtime.startTime), "yyyy-MM-dd");
        return showtimeDate === dateString;
      });

      // Sort showtimes by start time
      dayShowtimes.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      days.push({
        date: day,
        dateString,
        showtimes: dayShowtimes,
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday: isToday(day),
      });

      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Week day headers
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePreviousMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentMonth, "LLLL yyyy", { locale: vi })}
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-r border-gray-200 px-2 py-3 text-center text-sm font-semibold text-gray-700 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              const showScrollbar = day.showtimes.length > 10;
              
              return (
                <div
                  key={day.dateString}
                  className={`min-h-32 border-b border-r border-gray-200 p-2 flex flex-col ${
                    index >= calendarDays.length - 7 ? "border-b-0" : ""
                  } ${
                    (index + 1) % 7 === 0 ? "border-r-0" : ""
                  } ${
                    !day.isCurrentMonth ? "bg-gray-50" : ""
                  } ${
                    day.isToday ? "bg-blue-50" : ""
                  }`}
                >
                  {/* Date Number */}
                  <div className="mb-2 flex items-center justify-between flex-shrink-0">
                    <span
                      className={`text-sm font-semibold ${
                        !day.isCurrentMonth
                          ? "text-gray-400"
                          : day.isToday
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"
                          : isWeekend
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {format(day.date, "d")}
                    </span>

                    {/* Showtime Count Badge */}
                    {day.showtimes.length > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {day.showtimes.length}
                      </span>
                    )}
                  </div>

                  {/* Showtimes with Scrollbar */}
                  <div 
                    className={`space-y-1 flex-1 ${
                      showScrollbar 
                        ? "overflow-y-auto max-h-[400px] pr-1" 
                        : ""
                    }`}
                    style={showScrollbar ? {
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#9ca3af #f3f4f6'
                    } : {}}
                  >
                    {day.showtimes.map((showtime) => (
                      <ShowtimeCardCompact
                        key={showtime.id}
                        showtime={showtime}
                        onClick={() => onShowtimeClick(showtime)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-blue-50 border border-blue-200" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-blue-100" />
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-blue-700">3</span>
            <span>Has showtimes</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-50" />
          <span>Outside current month</span>
        </div>
      </div>
    </div>
  );
}
