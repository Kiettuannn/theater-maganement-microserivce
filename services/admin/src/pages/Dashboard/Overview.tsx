import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTodayRevenue } from "@/hooks/useTodayRevenue";
import { useTodayShowtimes } from "@/hooks/useTodayShowtimes";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Film,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  Ticket,
  ChartColumn,
  UserCog,
} from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function DashboardOverview() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { data: revenueData } = useTodayRevenue();
  const { showtimes } = useTodayShowtimes();

  // Get current date and time
  const now = new Date();
  const currentHour = now.getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";

  if (statsLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">{greeting}!</h1>
        <p className="text-muted-foreground">
          System overview for the cinema network
        </p>
      </div>

      {/* Quick Stats - Always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Today's Showtimes
              </h3>
              <p className="text-3xl font-bold text-foreground mt-2">
                {showtimes.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Active today</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500 opacity-80" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Now Showing
              </h3>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.totalMovies}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across genres
              </p>
            </div>
            <Film className="w-10 h-10 text-purple-500 opacity-80" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Tickets Sold Today
              </h3>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.todayTicketsSold}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Successful transactions
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-80" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Customers
              </h3>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.totalCustomers}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total members
              </p>
            </div>
            <Users className="w-10 h-10 text-orange-500 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Section - Show if has permission */}
        {hasPermission(PERMISSIONS.REPORT_READ) && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-foreground">
                Today's Revenue
              </h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Ticket Revenue
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(revenueData?.ticketRevenue || 0)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Concession Revenue
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(revenueData?.comboRevenue || 0)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-900 dark:text-green-200">
                    Net Revenue
                  </span>
                  <span className="font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(revenueData?.netRevenue || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Showtime Section - Show if has permission */}
        {hasPermission(PERMISSIONS.SHOWTIME_READ) && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-foreground">
                Upcoming Showtimes
              </h2>
            </div>
            <div className="space-y-3">
              {showtimes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No showtimes today
                </p>
              ) : (
                showtimes.slice(0, 3).map((showtime) => (
                  <div
                    key={showtime.id}
                    className="p-3 bg-muted rounded hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">
                          {showtime.movieName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {showtime.roomName}
                          {showtime.cinemaName
                            ? ` • ${showtime.cinemaName}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {formatTime(showtime.startTime)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - Show based on permissions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {hasPermission(PERMISSIONS.BOOKING_CREATE) && (
            <button
              onClick={() => navigate(ROUTES.TICKET_BOOKING)}
              className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left cursor-pointer"
            >
              <Ticket className="w-6 h-6 mb-2 text-blue-600" />
              <p className="text-sm font-medium text-foreground">
                Sell Tickets
              </p>
            </button>
          )}
          {hasPermission(PERMISSIONS.MOVIE_READ) && (
            <button
              onClick={() => navigate(ROUTES.MOVIES)}
              className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left cursor-pointer"
            >
              <Film className="w-6 h-6 mb-2 text-purple-600" />
              <p className="text-sm font-medium text-foreground">Movies</p>
            </button>
          )}
          {hasPermission(PERMISSIONS.SHOWTIME_READ) && (
            <button
              onClick={() => navigate(ROUTES.ROOMS)}
              className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left cursor-pointer"
            >
              <Calendar className="w-6 h-6 mb-2 text-orange-600" />
              <p className="text-sm font-medium text-foreground">Showtimes</p>
            </button>
          )}
          {hasPermission(PERMISSIONS.CUSTOMER_READ) && (
            <button
              onClick={() => navigate(ROUTES.CUSTOMERS)}
              className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left cursor-pointer"
            >
              <Users className="w-6 h-6 mb-2 text-cyan-600" />
              <p className="text-sm font-medium text-foreground">Customers</p>
            </button>
          )}
          {hasPermission(PERMISSIONS.REPORT_READ) && (
            <button
              onClick={() => navigate(ROUTES.REPORTS)}
              className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left cursor-pointer"
            >
              <ChartColumn className="w-6 h-6 mb-2 text-green-600" />
              <p className="text-sm font-medium text-foreground">Reports</p>
            </button>
          )}
          {hasPermission(PERMISSIONS.STAFF_READ) && (
            <button
              onClick={() => navigate(ROUTES.STAFF)}
              className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left cursor-pointer"
            >
              <UserCog className="w-6 h-6 mb-2 text-indigo-600" />
              <p className="text-sm font-medium text-foreground">Staff</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
