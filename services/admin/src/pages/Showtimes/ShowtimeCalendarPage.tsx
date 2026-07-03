import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ROUTES } from "@/constants/routes";
import { ShowtimeCalendar } from "@/components/showtimes/ShowtimeCalendar";
import { ShowtimeDetailModal } from "@/components/showtimes/ShowtimeDetailModal";
import { CreateShowtimeDialog } from "@/components/showtimes/CreateShowtimeDialog";
import { EditShowtimeDialog } from "@/components/showtimes/EditShowtimeDialog";
import { DeleteShowtimeDialog } from "@/components/showtimes/DeleteShowtimeDialog";
import {
  getAllShowtimes,
  type ShowtimeResponse,
} from "@/services/showtimeService";
import { getAllRooms, type Room } from "@/services/roomService";
import { useNotificationStore } from "@/stores";
import { Monitor } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function ShowtimeCalendarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    searchParams.get("roomId") || null,
  );
  const [allShowtimes, setAllShowtimes] = useState<ShowtimeResponse[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      loadShowtimes();
    } else {
      setAllShowtimes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await getAllRooms();
      setRooms(data);
    } catch (error) {
      console.error("Failed to load rooms:", error);
      addNotification({ type: "error", title: "Error", message: "Unable to load rooms" });
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadShowtimes = async () => {
    if (!selectedRoomId) return;
    try {
      setLoadingShowtimes(true);
      const data = await getAllShowtimes();
      setAllShowtimes(data.filter((s) => s.roomId === selectedRoomId));
    } catch (error) {
      console.error("Failed to load showtimes:", error);
      addNotification({ type: "error", title: "Error", message: "Unable to load showtimes" });
    } finally {
      setLoadingShowtimes(false);
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    navigate(`${ROUTES.SHOWTIMES}?roomId=${roomId}`, { replace: true });
  };

  const handleBackToRooms = () => {
    setSelectedRoomId(null);
    setAllShowtimes([]);
    navigate(ROUTES.SHOWTIMES, { replace: true });
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movie Schedule"
        description={
          selectedRoom
            ? `Schedule for ${selectedRoom.name}`
            : "Select a room to view its movie schedule"
        }
      />

      {!selectedRoomId ? (
        /* ── Room grid ── */
        <div>
          {loadingRooms ? (
            <LoadingSpinner message="Loading rooms..." />
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Monitor className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
              <h3 className="text-lg font-semibold text-foreground">No Rooms Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                There are currently no rooms in the system.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room.id)}
                  className="rounded-lg border border-border bg-card p-6 text-left hover:shadow-md hover:border-primary transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Monitor className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {room.name}
                      </h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {room.roomType?.toLowerCase().replace("_", " ") || "Standard"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Capacity: {room.capacity ?? "—"} seats</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${room.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {room.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Calendar view ── */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBackToRooms} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to rooms
            </Button>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-foreground">{selectedRoom?.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {selectedRoom?.roomType?.toLowerCase().replace("_", " ")} · {selectedRoom?.capacity} seats
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Showtime
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Showtime
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete Showtime
            </Button>
          </div>

          {/* Calendar */}
          <ShowtimeCalendar
            showtimes={allShowtimes}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onShowtimeClick={(showtime) => {
              setSelectedShowtimeId(showtime.id);
              setDetailModalOpen(true);
            }}
            loading={loadingShowtimes}
          />

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Total Showtimes", value: allShowtimes.length, color: "text-foreground" },
              { label: "Scheduled", value: allShowtimes.filter((s) => s.status === "SCHEDULED").length, color: "text-blue-600" },
              { label: "Ongoing", value: allShowtimes.filter((s) => s.status === "ONGOING").length, color: "text-green-600" },
              { label: "Completed", value: allShowtimes.filter((s) => s.status === "COMPLETED").length, color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ShowtimeDetailModal
        showtimeId={selectedShowtimeId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedShowtimeId(null);
        }}
      />

      {selectedRoomId && selectedRoom && (
        <>
          <CreateShowtimeDialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            cinemaId=""
            cinemaName={selectedRoom.name}
            cinemaBuffer={0}
            rooms={rooms}
            onSuccess={loadShowtimes}
          />
          <EditShowtimeDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            cinemaName={selectedRoom.name}
            cinemaBuffer={0}
            rooms={rooms}
            showtimes={allShowtimes}
            onSuccess={loadShowtimes}
          />
          <DeleteShowtimeDialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            cinemaName={selectedRoom.name}
            showtimes={allShowtimes}
            onSuccess={loadShowtimes}
          />
        </>
      )}
    </div>
  );
}
