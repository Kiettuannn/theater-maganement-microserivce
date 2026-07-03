import { useState, useEffect } from "react";
import { getAllShowtimes, type ShowtimeResponse } from "@/services/showtimeService";
import { useAuthStore } from "@/stores";

export function useTodayShowtimes() {
  const [showtimes, setShowtimes] = useState<ShowtimeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cinemaId = useAuthStore((state) => state.cinemaId);

  useEffect(() => {
    const fetchTodayShowtimes = async () => {
      try {
        setLoading(true);
        setError(null);

        const allShowtimes = await getAllShowtimes();
        
        // Filter for today's showtimes
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayShowtimes = allShowtimes.filter((showtime) => {
          const showtimeDate = new Date(showtime.startTime);
          
          // Filter by cinema if user has cinemaId
          if (cinemaId && showtime.cinemaId !== cinemaId) {
            return false;
          }
          
          return showtimeDate >= today && showtimeDate < tomorrow;
        });

        // Sort by start time
        todayShowtimes.sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        setShowtimes(todayShowtimes);
      } catch (err: any) {
        console.error("Failed to load today's showtimes:", err);
        setError(err?.message || "Failed to load showtimes");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayShowtimes();
  }, [cinemaId]);

  return { showtimes, loading, error };
}
