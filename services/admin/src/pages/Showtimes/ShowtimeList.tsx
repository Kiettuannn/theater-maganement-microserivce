import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Plus,
  Search,
  Film,
  MapPin,
  Calendar,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useShowtimeManager } from "@/hooks/useShowtimeManager";
import { type ShowtimeResponse } from "@/services/showtimeService";
import { getAllRooms, type Room } from "@/services/roomService";
import { useNotificationStore } from "@/stores";
import { format, parse, addMinutes } from "date-fns";
import { ROUTES } from "@/constants/routes";

export function ShowtimeList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const {
    showtimes,
    loading,
    saving,
    confirmDialog,
    loadData: loadShowtimes,
    refreshShowtimes,
    handleUpdateShowtime,
    handleDeleteShowtime,
    closeConfirmDialog,
  } = useShowtimeManager();

  const [rooms, setRooms] = useState<Room[]>([]);

  // Filters — roomId pre-filled from URL query param (?roomId=xxx)
  const [roomFilter, setRoomFilter] = useState<string>(
    searchParams.get("roomId") || "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("startTime-desc");

  // Edit dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    showtime: ShowtimeResponse | null;
    startTime: string;
    endTime: string;
    movieDuration: number;
    isInitialLoad: boolean;
  }>({
    open: false,
    showtime: null,
    startTime: "",
    endTime: "",
    movieDuration: 0,
    isInitialLoad: false,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 1 minute at exact minute marks (only when tab is visible)
  useAutoRefresh({
    onRefresh: async () => {
      try {
        await refreshShowtimes();
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    },
    interval: 60000, // 1 minute
    enabled: true,
    syncToMinute: true,
  });

  // Auto-calculate end time when start time changes in edit dialog (with 1s delay)
  useEffect(() => {
    // Skip auto-calculation during initial load
    if (editDialog.isInitialLoad) {
      const timer = setTimeout(() => {
        setEditDialog((prev) => ({ ...prev, isInitialLoad: false }));
      }, 0);
      return () => clearTimeout(timer);
    }

    if (
      editDialog.open &&
      editDialog.startTime &&
      editDialog.movieDuration > 0
    ) {
      // Delay 1 second to allow user to finish selecting date/time
      const debounceTimer = setTimeout(() => {
        try {
          const start = parse(
            editDialog.startTime,
            "yyyy-MM-dd'T'HH:mm",
            new Date(),
          );
          if (isNaN(start.getTime())) {
            return;
          }

          const end = addMinutes(start, editDialog.movieDuration);
          const endTimeStr = format(end, "yyyy-MM-dd'T'HH:mm");

          // Only update if different to avoid infinite loops
          if (editDialog.endTime !== endTimeStr) {
            setEditDialog((prev) => ({ ...prev, endTime: endTimeStr }));
          }
        } catch (error) {
          console.error("Failed to auto-calculate end time:", error);
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(debounceTimer);
    }
  }, [
    editDialog.startTime,
    editDialog.movieDuration,
    editDialog.open,
    editDialog.isInitialLoad,
    editDialog.endTime,
  ]);

  const loadData = async () => {
    try {
      await loadShowtimes();
      // Load all rooms (no cinema filter)
      const roomsData = await getAllRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to load rooms",
      });
    }
  };

  const filteredAndSortedShowtimes = showtimes
    .filter((showtime) => {
      if (roomFilter !== "all" && showtime.roomId !== roomFilter) return false;
      if (
        searchQuery &&
        !showtime.movieName.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "startTime-asc":
          return (
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
        case "startTime-desc":
          return (
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );
        case "created":
          // Keep original order from database
          return 0;
        default:
          return (
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
      }
    });

  const stats = {
    total: showtimes.length,
    scheduled: showtimes.filter((s) => s.status === "SCHEDULED").length,
    ongoing: showtimes.filter((s) => s.status === "ONGOING").length,
    completed: showtimes.filter((s) => s.status === "COMPLETED").length,
  };

  const handleEdit = async (showtime: ShowtimeResponse) => {
    // Calculate movie duration from existing start/end times
    const start = new Date(showtime.startTime);
    const end = new Date(showtime.endTime);
    const durationMinutes = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60),
    );

    setEditDialog({
      open: true,
      showtime,
      startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
      movieDuration: durationMinutes,
      isInitialLoad: true, // Mark as initial load to skip first auto-calculation
    });
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setEditDialog((prev) => ({ ...prev, startTime: newStartTime }));
  };

  const handleSaveEdit = async () => {
    if (!editDialog.showtime) return;

    // Format datetime without timezone conversion (same as CreateShowtime)
    const formatForBackend = (dateTimeString: string) => {
      return dateTimeString + ":00"; // Add seconds
    };

    const payload = {
      roomId: editDialog.showtime.roomId,
      movieId: editDialog.showtime.movieId,
      startTime: formatForBackend(editDialog.startTime),
      endTime: formatForBackend(editDialog.endTime),
    };

    const success = await handleUpdateShowtime(editDialog.showtime.id, payload);

    if (success) {
      setEditDialog({
        open: false,
        showtime: null,
        startTime: "",
        endTime: "",
        movieDuration: 0,
        isInitialLoad: false,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      SCHEDULED: { label: "Scheduled", variant: "default" as const },
      ONGOING: { label: "Ongoing", variant: "secondary" as const },
      COMPLETED: { label: "Completed", variant: "outline" as const },
    };
    const { label, variant } =
      config[status as keyof typeof config] || config.SCHEDULED;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Showtime Management"
          description="Manage movie showtimes by room and schedule"
        />
        <Button
          onClick={() => navigate(`${ROUTES.SHOWTIMES}/create`)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Showtime
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Total</div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {stats.total}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Scheduled
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {stats.scheduled}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Ongoing
          </div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {stats.ongoing}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Completed
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-600">
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Search Movie</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by movie title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startTime-asc">
                  Showtime (Earliest)
                </SelectItem>
                <SelectItem value="startTime-desc">
                  Showtime (Latest)
                </SelectItem>
                <SelectItem value="created">Created Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Room</Label>
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Movie</TableHead>
              <TableHead>Cinema & Room</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredAndSortedShowtimes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No showtimes found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedShowtimes.map((showtime) => (
                <TableRow key={showtime.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{showtime.movieName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{showtime.cinemaName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {showtime.roomName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(showtime.startTime),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(showtime.endTime), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(showtime.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(showtime)}
                        disabled={showtime.status !== "SCHEDULED"}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteShowtime(showtime)}
                        disabled={showtime.status !== "SCHEDULED"}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open: boolean) => setEditDialog({ ...editDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Showtime</DialogTitle>
            <DialogDescription>
              Adjust the start time only. End time will be calculated
              automatically.
            </DialogDescription>
          </DialogHeader>

          {editDialog.showtime && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Movie</Label>
                <Input
                  value={editDialog.showtime.movieName}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Movie cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label>Room</Label>
                <Input
                  value={editDialog.showtime.roomName}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Room cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={`${editDialog.movieDuration} minutes`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={editDialog.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={editDialog.endTime}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calculated: Start time + {editDialog.movieDuration}{" "}
                  minutes
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setEditDialog({
                  open: false,
                  showtime: null,
                  startTime: "",
                  endTime: "",
                  movieDuration: 0,
                  isInitialLoad: false,
                })
              }
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={saving}
      />
    </div>
  );
}
