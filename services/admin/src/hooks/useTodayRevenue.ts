import { useState, useEffect } from "react";
import { revenueService } from "@/services/revenueService";
import { useAuthStore } from "@/stores";

export interface TodayRevenueDetail {
  ticketRevenue: number;
  comboRevenue: number;
  netRevenue: number;
  totalTransactions: number;
}

export function useTodayRevenue() {
  const [data, setData] = useState<TodayRevenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cinemaId = useAuthStore((state) => state.cinemaId);

  useEffect(() => {
    const fetchTodayRevenue = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use local timezone instead of UTC
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const date = String(today.getDate()).padStart(2, "0");
        const todayString = `${year}-${month}-${date}`;

        const revenues = await revenueService.getDailyRevenue({
          cinemaId: cinemaId || undefined,
          from: todayString,
          to: todayString,
        });

        // Aggregate across all cinemas if multiple rows returned
        const totals = (revenues || []).reduce(
          (acc, r) => ({
            ticketRevenue: acc.ticketRevenue + (r.ticketRevenue || 0),
            comboRevenue: acc.comboRevenue + (r.comboRevenue || 0),
            netRevenue: acc.netRevenue + (r.netRevenue || 0),
            totalTransactions: acc.totalTransactions + (r.totalTransactions || 0),
          }),
          { ticketRevenue: 0, comboRevenue: 0, netRevenue: 0, totalTransactions: 0 }
        );
        setData(totals);
      } catch (err: any) {
        console.error("Failed to load today's revenue:", err);
        setError(err?.message || "Failed to load revenue data");
        setData({
          ticketRevenue: 0,
          comboRevenue: 0,
          netRevenue: 0,
          totalTransactions: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTodayRevenue();
  }, [cinemaId]);

  return { data, loading, error };
}
