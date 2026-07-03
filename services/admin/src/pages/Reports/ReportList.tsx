import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  revenueService,
  type DailyRevenueRow,
  type MovieRevenue,
  type RevenueReportRow,
  type ReportType,
} from "@/services/revenueService";
import { getAllCinemas, type Cinema } from "@/services/cinemaService";
import { getAllMovies } from "@/services/movieService";
import type { MovieSimple } from "@/types/MovieType/Movie";
import { useNotificationStore, useAuthStore } from "@/stores";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

type TabType = "movies" | "daily" | "reports";

export const ReportList = () => {
  const today = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<TabType>("movies");
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );
  const managerCinemaId = useAuthStore((state) => state.cinemaId);

  // Movies tab filters
  const [movieFrom, setMovieFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [movieTo, setMovieTo] = useState(() =>
    today.toISOString().slice(0, 10),
  );
  const [movieCinemaId, setMovieCinemaId] = useState<string | undefined>(
    managerCinemaId || undefined,
  );
  const [movieId, setMovieId] = useState<string | undefined>(undefined);

  // Daily summary tab filters
  const [dailyFrom, setDailyFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [dailyTo, setDailyTo] = useState(() =>
    today.toISOString().slice(0, 10),
  );
  const [dailyCinemaId, setDailyCinemaId] = useState<string | undefined>(
    managerCinemaId || undefined,
  );

  // Saved reports tab filters
  const [reportsFrom, setReportsFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [reportsTo, setReportsTo] = useState(() =>
    today.toISOString().slice(0, 10),
  );
  const [reportsCinemaId, setReportsCinemaId] = useState<string | undefined>(
    managerCinemaId || undefined,
  );
  const [reportType, setReportType] = useState<ReportType>("MONTHLY");

  // Report-specific inputs
  const [reportDate, setReportDate] = useState(() =>
    today.toISOString().slice(0, 10),
  ); // For DAILY
  const [reportWeek, setReportWeek] = useState("1"); // For WEEKLY
  const [reportMonthForWeekly, setReportMonthForWeekly] = useState(() => {
    const m = today.getMonth() + 1;
    return m < 10 ? `0${m}` : `${m}`;
  }); // For WEEKLY
  const [reportYearForWeekly, setReportYearForWeekly] = useState(
    () => `${today.getFullYear()}`,
  ); // For WEEKLY
  const [reportMonth, setReportMonth] = useState(() => {
    const m = today.getMonth() + 1;
    return m < 10 ? `0${m}` : `${m}`;
  }); // For MONTHLY
  const [reportYear, setReportYear] = useState(() => `${today.getFullYear()}`); // For YEARLY/MONTHLY

  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [movieRevenue, setMovieRevenue] = useState<MovieRevenue[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyRevenueRow[]>([]);
  const [reports, setReports] = useState<RevenueReportRow[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getAllCinemas()
      .then(setCinemas)
      .catch(() => {});
  }, []);

  useEffect(() => {
    getAllMovies()
      .then(setMovies)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setMoviesLoading(true);
        setMoviesError(null);
        const movie = await revenueService.getMovieRevenue({
          cinemaId: movieCinemaId,
          movieId,
          from: movieFrom,
          to: movieTo,
        });
        setMovieRevenue(movie);
      } catch (err: any) {
        setMoviesError(
          err?.response?.data?.message || "Failed to load movie revenue",
        );
      } finally {
        setMoviesLoading(false);
      }
    };
    fetchMovies();
  }, [movieCinemaId, movieId, movieFrom, movieTo]);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        setDailyLoading(true);
        setDailyError(null);
        const daily = await revenueService.getDailyRevenue({
          cinemaId: dailyCinemaId,
          from: dailyFrom,
          to: dailyTo,
        });
        setDailySummary(daily);
      } catch (err: any) {
        setDailyError(
          err?.response?.data?.message || "Failed to load daily revenue",
        );
      } finally {
        setDailyLoading(false);
      }
    };
    fetchDaily();
  }, [dailyCinemaId, dailyFrom, dailyTo]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setReportsLoading(true);
        setReportsError(null);

        // Calculate date range based on report type
        let from = reportsFrom;
        let to = reportsTo;

        if (reportType !== "CUSTOM") {
          switch (reportType) {
            case "DAILY":
              from = reportDate;
              to = reportDate;
              break;
            case "WEEKLY": {
              const year = parseInt(reportYearForWeekly);
              const month = parseInt(reportMonthForWeekly);
              const week = parseInt(reportWeek);

              const firstDay = new Date(year, month - 1, 1);
              let firstMonday = new Date(firstDay);
              const dayOfWeek = firstMonday.getDay();
              const daysUntilMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              firstMonday.setDate(
                firstDay.getDate() +
                  (daysUntilMonday === 0 ? 0 : 7 - daysUntilMonday),
              );

              const weekStart = new Date(firstMonday);
              weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);

              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);

              from = weekStart.toISOString().slice(0, 10);
              to = weekEnd.toISOString().slice(0, 10);
              break;
            }
            case "MONTHLY": {
              const year = parseInt(reportYear);
              const month = parseInt(reportMonth);
              const firstDay = new Date(year, month - 1, 1);
              const lastDay = new Date(year, month, 0);
              from = firstDay.toISOString().slice(0, 10);
              to = lastDay.toISOString().slice(0, 10);
              break;
            }
            case "YEARLY": {
              const year = parseInt(reportYear);
              from = `${year}-01-01`;
              to = `${year}-12-31`;
              break;
            }
          }
        }

        const report = await revenueService.getRevenueReports({
          cinemaId: reportsCinemaId,
          reportType,
          from,
          to,
        });
        setReports(report);
      } catch (err: any) {
        setReportsError(
          err?.response?.data?.message || "Failed to load reports",
        );
      } finally {
        setReportsLoading(false);
      }
    };
    fetchReports();
  }, [
    reportsCinemaId,
    reportsFrom,
    reportsTo,
    reportType,
    reportDate,
    reportMonth,
    reportYear,
    reportMonthForWeekly,
    reportYearForWeekly,
    reportWeek,
  ]);

  // Tab-specific metrics
  const movieTotals = useMemo(() => {
    const totalTickets = movieRevenue.reduce(
      (acc, r) => acc + (r.totalTicketsSold || 0),
      0,
    );
    const totalRevenue = movieRevenue.reduce(
      (acc, r) => acc + Number(r.totalRevenue || 0),
      0,
    );
    const uniqueMovies = new Set(movieRevenue.map((r) => r.movieId)).size;
    return { totalTickets, totalRevenue, uniqueMovies };
  }, [movieRevenue]);

  const dailyTotals = useMemo(() => {
    const ticketRevenue = dailySummary.reduce(
      (acc, r) => acc + Number(r.ticketRevenue || 0),
      0,
    );
    const comboRevenue = dailySummary.reduce(
      (acc, r) => acc + Number(r.comboRevenue || 0),
      0,
    );
    const netRevenue = dailySummary.reduce(
      (acc, r) => acc + Number(r.netRevenue || 0),
      0,
    );
    const totalTransactions = dailySummary.reduce(
      (acc, r) => acc + (r.totalTransactions || 0),
      0,
    );
    return { ticketRevenue, comboRevenue, netRevenue, totalTransactions };
  }, [dailySummary]);

  const reportTotals = useMemo(() => {
    const totalTicketRevenue = reports.reduce(
      (acc, r) => acc + Number(r.totalTicketRevenue || 0),
      0,
    );
    const totalComboRevenue = reports.reduce(
      (acc, r) => acc + Number(r.totalComboRevenue || 0),
      0,
    );
    const netRevenue = reports.reduce(
      (acc, r) => acc + Number(r.netRevenue || 0),
      0,
    );
    const reportCount = reports.length;
    return { totalTicketRevenue, totalComboRevenue, netRevenue, reportCount };
  }, [reports]);

  const cinemaMap = useMemo(() => {
    const map: Record<string, Cinema> = {};
    cinemas.forEach((c) => (map[c.id] = c));
    return map;
  }, [cinemas]);

  const movieMap = useMemo(() => {
    const map: Record<string, MovieSimple> = {};
    movies.forEach((m) => (map[m.id] = m));
    return map;
  }, [movies]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "movies", label: "Movie Revenue", icon: "" },
    { id: "daily", label: "Daily Summary", icon: "" },
    { id: "reports", label: "Saved Reports", icon: "" },
  ];

  const handleGenerateReport = async () => {
    const todayDate = today.toISOString().slice(0, 10);
    let startDate = reportsFrom;
    let endDate = reportsTo;

    // Validate dates based on report type
    if (reportType !== "CUSTOM") {
      switch (reportType) {
        case "DAILY":
          if (reportDate > todayDate) {
            addNotification({
              type: "error",
              title: "Invalid date",
              message: "Cannot select future date",
            });
            return;
          }
          startDate = reportDate;
          endDate = reportDate;
          break;
        case "WEEKLY": {
          const year = parseInt(reportYearForWeekly);
          const month = parseInt(reportMonthForWeekly);
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth() + 1;

          if (
            year > currentYear ||
            (year === currentYear && month > currentMonth)
          ) {
            addNotification({
              type: "error",
              title: "Invalid week",
              message: "Cannot select future week",
            });
            return;
          }

          const week = parseInt(reportWeek);

          // Find first Monday of the month
          const firstDay = new Date(year, month - 1, 1);
          let firstMonday = new Date(firstDay);
          const dayOfWeek = firstMonday.getDay();
          const daysUntilMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday=0
          firstMonday.setDate(
            firstDay.getDate() +
              (daysUntilMonday === 0 ? 0 : 7 - daysUntilMonday),
          );

          // Calculate the start of the requested week
          const weekStart = new Date(firstMonday);
          weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // +6 days to get Sunday

          startDate = weekStart.toISOString().slice(0, 10);
          endDate = weekEnd.toISOString().slice(0, 10);
          break;
        }
        case "MONTHLY": {
          const year = parseInt(reportYear);
          const month = parseInt(reportMonth);
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth() + 1;

          if (
            year > currentYear ||
            (year === currentYear && month > currentMonth)
          ) {
            addNotification({
              type: "error",
              title: "Invalid month",
              message: "Cannot select future month",
            });
            return;
          }

          const firstDay = new Date(year, month - 1, 1);
          const lastDay = new Date(year, month, 0);
          startDate = firstDay.toISOString().slice(0, 10);
          endDate = lastDay.toISOString().slice(0, 10);
          break;
        }
        case "YEARLY": {
          const year = parseInt(reportYear);
          const currentYear = today.getFullYear();

          if (year > currentYear) {
            addNotification({
              type: "error",
              title: "Invalid year",
              message: "Cannot select future year",
            });
            return;
          }

          startDate = `${year}-01-01`;
          endDate = `${year}-12-31`;
          break;
        }
      }
    } else {
      // CUSTOM type validation
      if (reportsFrom > todayDate || reportsTo > todayDate) {
        addNotification({
          type: "error",
          title: "Invalid date range",
          message: "Cannot select future dates",
        });
        return;
      }
      startDate = reportsFrom;
      endDate = reportsTo;
    }

    try {
      setGenerating(true);
      await revenueService.generateReport({
        cinemaId: reportsCinemaId || "",
        reportType,
        startDate,
        endDate,
      });
      addNotification({
        type: "success",
        title: "Report generated",
        message: "Saved report has been created",
      });
      // Refresh reports
      const refreshed = await revenueService.getRevenueReports({
        cinemaId: reportsCinemaId,
        reportType,
        from: startDate,
        to: endDate,
      });
      setReports(refreshed);
    } catch (err: any) {
      addNotification({
        type: "error",
        title: "Failed to generate",
        message: err?.response?.data?.message || "Could not generate report",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Revenue & Reports"
        description="Movie revenue, daily summaries, and consolidated reports"
      />

      {/* Tab-specific summary cards */}
      {activeTab === "movies" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Tickets Sold</p>
            <p className="text-2xl font-semibold">
              {movieTotals.totalTickets.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-semibold">
              {currency.format(movieTotals.totalRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Unique Movies</p>
            <p className="text-2xl font-semibold">{movieTotals.uniqueMovies}</p>
          </div>
        </div>
      )}

      {activeTab === "daily" && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Ticket Revenue</p>
            <p className="text-2xl font-semibold">
              {currency.format(dailyTotals.ticketRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Combo Revenue</p>
            <p className="text-2xl font-semibold">
              {currency.format(dailyTotals.comboRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Net Revenue</p>
            <p className="text-2xl font-semibold">
              {currency.format(dailyTotals.netRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-semibold">
              {dailyTotals.totalTransactions.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Ticket Revenue</p>
            <p className="text-2xl font-semibold">
              {currency.format(reportTotals.totalTicketRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Combo Revenue</p>
            <p className="text-2xl font-semibold">
              {currency.format(reportTotals.totalComboRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Net Revenue</p>
            <p className="text-2xl font-semibold">
              {currency.format(reportTotals.netRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Reports Count</p>
            <p className="text-2xl font-semibold">{reportTotals.reportCount}</p>
          </div>
        </div>
      )}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Movie Revenue Tab */}
        {activeTab === "movies" && (
          <section className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Filters
              </h3>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">From</label>
                  <input
                    className="w-full rounded-md border border-border px-3 py-2"
                    type="date"
                    value={movieFrom}
                    onChange={(e) => setMovieFrom(e.target.value)}
                    max={today.toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">To</label>
                  <input
                    className="w-full rounded-md border border-border px-3 py-2"
                    type="date"
                    value={movieTo}
                    onChange={(e) => setMovieTo(e.target.value)}
                    max={today.toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">
                    Cinema
                  </label>
                  <select
                    className="w-full rounded-md border border-border px-3 py-2"
                    value={movieCinemaId || ""}
                    onChange={(e) =>
                      setMovieCinemaId(e.target.value || undefined)
                    }
                    disabled={!!managerCinemaId}
                  >
                    <option value="">All</option>
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Movie</label>
                  <select
                    className="w-full rounded-md border border-border px-3 py-2"
                    value={movieId || ""}
                    onChange={(e) => setMovieId(e.target.value || undefined)}
                  >
                    <option value="">All</option>
                    {movies.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">By Movie</p>
                <h2 className="text-xl font-semibold">Movie Revenue</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {movieRevenue.length} entries
              </span>
            </div>
            {moviesError && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
                {moviesError}
              </div>
            )}
            {moviesLoading ? (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm">
                Loading movie revenue...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bar Chart - Show aggregated data by date */}
                {movieRevenue.length > 0 &&
                  (() => {
                    // Aggregate by date
                    const aggregated = movieRevenue.reduce(
                      (acc, row) => {
                        const existing = acc.find(
                          (item) => item.date === row.reportDate,
                        );
                        if (existing) {
                          existing.revenue += Number(row.totalRevenue);
                          existing.tickets += row.totalTicketsSold;
                        } else {
                          acc.push({
                            date: row.reportDate,
                            revenue: Number(row.totalRevenue),
                            tickets: row.totalTicketsSold,
                          });
                        }
                        return acc;
                      },
                      [] as {
                        date: string;
                        revenue: number;
                        tickets: number;
                      }[],
                    );

                    return (
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <h3 className="mb-4 text-sm font-semibold">
                          Revenue by Date{" "}
                          {movieCinemaId || movieId ? "" : "(All)"}
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={aggregated.sort((a, b) =>
                              a.date.localeCompare(b.date),
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              formatter={(value) =>
                                currency.format(Number(value))
                              }
                            />
                            <Bar
                              dataKey="revenue"
                              fill="#3b82f6"
                              name="Revenue"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}

                <div>
                  <h3 className="mb-3 text-sm font-semibold">Detailed Data</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Movie</th>
                          <th className="px-3 py-2">Cinema</th>
                          <th className="px-3 py-2">Tickets</th>
                          <th className="px-3 py-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {movieRevenue.map((row) => (
                          <tr key={row.id} className="hover:bg-muted/30">
                            <td className="px-3 py-2">{row.reportDate}</td>
                            <td className="px-3 py-2 font-medium">
                              {movieMap[row.movieId]?.title ?? row.movieId}
                            </td>
                            <td className="px-3 py-2">
                              {cinemaMap[row.cinemaId]?.name ?? row.cinemaId}
                            </td>
                            <td className="px-3 py-2">
                              {row.totalTicketsSold}
                            </td>
                            <td className="px-3 py-2">
                              {currency.format(row.totalRevenue)}
                            </td>
                          </tr>
                        ))}
                        {movieRevenue.length === 0 && (
                          <tr>
                            <td
                              className="px-3 py-4 text-center text-muted-foreground"
                              colSpan={5}
                            >
                              No movie revenue data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Daily Summary Tab */}
        {activeTab === "daily" && (
          <section className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Filters
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">From</label>
                  <input
                    className="w-full rounded-md border border-border px-3 py-2"
                    type="date"
                    value={dailyFrom}
                    onChange={(e) => setDailyFrom(e.target.value)}
                    max={today.toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">To</label>
                  <input
                    className="w-full rounded-md border border-border px-3 py-2"
                    type="date"
                    value={dailyTo}
                    onChange={(e) => setDailyTo(e.target.value)}
                    max={today.toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">
                    Cinema
                  </label>
                  <select
                    className="w-full rounded-md border border-border px-3 py-2"
                    value={dailyCinemaId || ""}
                    onChange={(e) =>
                      setDailyCinemaId(e.target.value || undefined)
                    }
                    disabled={!!managerCinemaId}
                  >
                    <option value="">All</option>
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">By Day</p>
                <h2 className="text-xl font-semibold">Daily Revenue Summary</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {dailySummary.length} days
              </span>
            </div>
            {dailyError && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
                {dailyError}
              </div>
            )}
            {dailyLoading ? (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm">
                Loading daily revenue...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Charts - Show aggregated data by date */}
                {dailySummary.length > 0 &&
                  (() => {
                    // Aggregate by date
                    const aggregated = dailySummary.reduce(
                      (acc, row) => {
                        const existing = acc.find(
                          (item) => item.date === row.reportDate,
                        );
                        if (existing) {
                          existing.ticketRevenue += Number(row.ticketRevenue);
                          existing.comboRevenue += Number(row.comboRevenue);
                          existing.netRevenue += Number(row.netRevenue);
                        } else {
                          acc.push({
                            date: row.reportDate,
                            ticketRevenue: Number(row.ticketRevenue),
                            comboRevenue: Number(row.comboRevenue),
                            netRevenue: Number(row.netRevenue),
                          });
                        }
                        return acc;
                      },
                      [] as Array<{
                        date: string;
                        ticketRevenue: number;
                        comboRevenue: number;
                        netRevenue: number;
                      }>,
                    );

                    const totalTicket = dailySummary.reduce(
                      (acc, d) => acc + Number(d.ticketRevenue),
                      0,
                    );
                    const totalCombo = dailySummary.reduce(
                      (acc, d) => acc + Number(d.comboRevenue),
                      0,
                    );

                    return (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Line Chart - Revenue Trend */}
                        <div className="rounded-lg border border-border bg-muted/20 p-4">
                          <h3 className="mb-4 text-sm font-semibold">
                            Revenue Trend {dailyCinemaId ? "" : "(All Cinemas)"}
                          </h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                              data={aggregated.sort((a, b) =>
                                a.date.localeCompare(b.date),
                              )}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip
                                formatter={(value) =>
                                  currency.format(Number(value))
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="netRevenue"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                name="Net Revenue"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Pie Chart - Ticket vs Combo */}
                        <div className="rounded-lg border border-border bg-muted/20 p-4">
                          <h3 className="mb-4 text-sm font-semibold">
                            Revenue Breakdown
                          </h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Ticket", value: totalTicket },
                                  { name: "Combo", value: totalCombo },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#3b82f6" />
                                <Cell fill="#8b5cf6" />
                              </Pie>
                              <Tooltip
                                formatter={(value) =>
                                  currency.format(Number(value))
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })()}

                {/* Table */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Detailed Data</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Cinema</th>
                          <th className="px-3 py-2">Ticket Rev</th>
                          <th className="px-3 py-2">Combo Rev</th>
                          <th className="px-3 py-2">Net Rev</th>
                          <th className="px-3 py-2">Transactions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {dailySummary.map((row) => (
                          <tr key={row.id} className="hover:bg-muted/30">
                            <td className="px-3 py-2">{row.reportDate}</td>
                            <td className="px-3 py-2">
                              {cinemaMap[row.cinemaId]?.name ?? row.cinemaId}
                            </td>
                            <td className="px-3 py-2">
                              {currency.format(row.ticketRevenue)}
                            </td>
                            <td className="px-3 py-2">
                              {currency.format(row.comboRevenue)}
                            </td>
                            <td className="px-3 py-2 font-medium">
                              {currency.format(row.netRevenue)}
                            </td>
                            <td className="px-3 py-2">
                              {row.totalTransactions}
                            </td>
                          </tr>
                        ))}
                        {dailySummary.length === 0 && (
                          <tr>
                            <td
                              className="px-3 py-4 text-center text-muted-foreground"
                              colSpan={6}
                            >
                              No daily revenue data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Saved Reports Tab */}
        {activeTab === "reports" && (
          <section className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Filters
              </h3>
              <div className="grid gap-3 md:grid-cols-2 mb-3">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">
                    Report Type
                  </label>
                  <select
                    className="w-full rounded-md border border-border px-3 py-2"
                    value={reportType}
                    onChange={(e) =>
                      setReportType(e.target.value as ReportType)
                    }
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom Range</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">
                    Cinema
                  </label>
                  <select
                    className="w-full rounded-md border border-border px-3 py-2"
                    value={reportsCinemaId || ""}
                    onChange={(e) =>
                      setReportsCinemaId(e.target.value || undefined)
                    }
                    disabled={!!managerCinemaId}
                  >
                    <option value="">All</option>
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DAILY input */}
              {reportType === "DAILY" && (
                <div className="grid gap-3 md:grid-cols-1">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Date
                    </label>
                    <input
                      className="w-full rounded-md border border-border px-3 py-2"
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      max={today.toISOString().slice(0, 10)}
                    />
                  </div>
                </div>
              )}

              {/* WEEKLY inputs */}
              {reportType === "WEEKLY" && (
                <div className="grid gap-3 grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Week
                    </label>
                    <select
                      className="w-full rounded-md border border-border px-3 py-2"
                      value={reportWeek}
                      onChange={(e) => setReportWeek(e.target.value)}
                    >
                      <option value="1">Week 1</option>
                      <option value="2">Week 2</option>
                      <option value="3">Week 3</option>
                      <option value="4">Week 4</option>
                      <option value="5">Week 5</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Month
                    </label>
                    <select
                      className="w-full rounded-md border border-border px-3 py-2"
                      value={reportMonthForWeekly}
                      onChange={(e) => setReportMonthForWeekly(e.target.value)}
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Year
                    </label>
                    <input
                      className="w-full rounded-md border border-border px-3 py-2"
                      type="number"
                      min="2020"
                      max={today.getFullYear() + 1}
                      value={reportYearForWeekly}
                      onChange={(e) => setReportYearForWeekly(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* MONTHLY inputs */}
              {reportType === "MONTHLY" && (
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Month
                    </label>
                    <select
                      className="w-full rounded-md border border-border px-3 py-2"
                      value={reportMonth}
                      onChange={(e) => setReportMonth(e.target.value)}
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Year
                    </label>
                    <input
                      className="w-full rounded-md border border-border px-3 py-2"
                      type="number"
                      min="2020"
                      max={today.getFullYear() + 1}
                      value={reportYear}
                      onChange={(e) => setReportYear(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* YEARLY input */}
              {reportType === "YEARLY" && (
                <div className="grid gap-3 md:grid-cols-1">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      Year
                    </label>
                    <input
                      className="w-full rounded-md border border-border px-3 py-2"
                      type="number"
                      min="2020"
                      max={today.getFullYear() + 1}
                      value={reportYear}
                      onChange={(e) => setReportYear(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* CUSTOM Range inputs */}
              {reportType === "CUSTOM" && (
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">
                      From
                    </label>
                    <input
                      className="w-full rounded-md border border-border px-3 py-2"
                      type="date"
                      value={reportsFrom}
                      onChange={(e) => setReportsFrom(e.target.value)}
                      max={today.toISOString().slice(0, 10)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">To</label>
                    <input
                      className="w-full rounded-md border border-border px-3 py-2"
                      type="date"
                      value={reportsTo}
                      onChange={(e) => setReportsTo(e.target.value)}
                      max={today.toISOString().slice(0, 10)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Saved Reports</p>
                <h2 className="text-xl font-semibold">Revenue Reports</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {reports.length} records
                </span>
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
                >
                  {generating ? "Generating..." : "Generate report"}
                </button>
              </div>
            </div>
            {reportsError && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
                {reportsError}
              </div>
            )}
            {reportsLoading ? (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm">
                Loading reports...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bar Chart - Revenue by Cinema */}
                {reports.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <h3 className="mb-4 text-sm font-semibold">
                      Revenue by Cinema
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={reports.map((r) => ({
                          cinema: cinemaMap[r.cinemaId]?.name ?? r.cinemaId,
                          ticket: Number(r.totalTicketRevenue),
                          combo: Number(r.totalComboRevenue),
                          net: Number(r.netRevenue),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cinema" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) => currency.format(Number(value))}
                        />
                        <Legend />
                        <Bar
                          dataKey="ticket"
                          fill="#3b82f6"
                          name="Ticket Revenue"
                        />
                        <Bar
                          dataKey="combo"
                          fill="#8b5cf6"
                          name="Combo Revenue"
                        />
                        <Bar dataKey="net" fill="#10b981" name="Net Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Table */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Report Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Cinema</th>
                          <th className="px-3 py-2">Range</th>
                          <th className="px-3 py-2">Ticket Rev</th>
                          <th className="px-3 py-2">Combo Rev</th>
                          <th className="px-3 py-2">Net Rev</th>
                          <th className="px-3 py-2">Generated At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reports.map((row) => (
                          <tr key={row.id} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-medium">
                              {row.reportType}
                            </td>
                            <td className="px-3 py-2">
                              {cinemaMap[row.cinemaId]?.name ?? row.cinemaId}
                            </td>
                            <td className="px-3 py-2">
                              {row.startDate} → {row.endDate}
                            </td>
                            <td className="px-3 py-2">
                              {currency.format(row.totalTicketRevenue)}
                            </td>
                            <td className="px-3 py-2">
                              {currency.format(row.totalComboRevenue)}
                            </td>
                            <td className="px-3 py-2 font-medium">
                              {currency.format(row.netRevenue)}
                            </td>
                            <td className="px-3 py-2">
                              {row.generatedAt
                                .replace("T", " ")
                                .substring(0, 16)}
                            </td>
                          </tr>
                        ))}
                        {reports.length === 0 && (
                          <tr>
                            <td
                              className="px-3 py-4 text-center text-muted-foreground"
                              colSpan={7}
                            >
                              No reports yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
