import { useState, useEffect } from "react";
import { getAllMovies } from "@/services/movieService";
import { getAllCustomers } from "@/services/customerService";
import { getAllStaffs } from "@/services/staffService";
import { revenueService } from "@/services/revenueService";
import { useAuthStore } from "@/stores";

export interface DashboardStats {
  totalMovies: number;
  totalCustomers: number;
  totalStaff: number;
  todayShowtimes: number;
  todayTicketsSold: number;
  todayRevenue: number;
  todayTransactions: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMovies: 0,
    totalCustomers: 0,
    totalStaff: 0,
    todayShowtimes: 0,
    todayTicketsSold: 0,
    todayRevenue: 0,
    todayTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cinemaId = useAuthStore((state) => state.cinemaId);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().slice(0, 10);

        // Fetch data in parallel
        const [movies, customers, staff, dailyRevenue] = await Promise.allSettled([
          getAllMovies(),
          getAllCustomers(),
          getAllStaffs(),
          revenueService.getDailyRevenue({
            cinemaId: cinemaId || undefined,
            from: today,
            to: today,
          }),
        ]);

        // Process results
        const movieCount = movies.status === "fulfilled" ? movies.value.length : 0;
        const customerCount = customers.status === "fulfilled" ? customers.value.length : 0;
        const staffCount = staff.status === "fulfilled" ? staff.value.length : 0;

        let todayRev = 0;
        let todayTrans = 0;
        if (dailyRevenue.status === "fulfilled" && dailyRevenue.value.length > 0) {
          const rev = dailyRevenue.value[0];
          todayRev = rev.netRevenue || 0;
          todayTrans = rev.totalTransactions || 0;
        }

        setStats({
          totalMovies: movieCount,
          totalCustomers: customerCount,
          totalStaff: staffCount,
          todayShowtimes: 0, // Will be updated when we have showtime API
          todayTicketsSold: todayTrans,
          todayRevenue: todayRev,
          todayTransactions: todayTrans,
        });
      } catch (err: any) {
        console.error("Failed to load dashboard stats:", err);
        setError(err?.message || "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [cinemaId]);

  return { stats, loading, error };
}
