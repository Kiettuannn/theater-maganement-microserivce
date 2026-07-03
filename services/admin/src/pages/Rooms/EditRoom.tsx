import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Plus, Sofa, Trash2 } from "lucide-react";
import { useNotificationStore } from "@/stores";
import { RoomStatus, RoomType } from "@/types/RoomType/room";
import { ROUTES } from "@/constants/routes";
import type { UpdateRoomRequest } from "@/types/RoomType/room";
import { useCinemas } from "@/hooks/useCinemas";
import { useSeatLayout } from "@/hooks/useSeatLayout";
import { SeatLayoutEditor } from "@/components/rooms/SeatLayoutEditor";
import { getAllSeatTypes } from "@/services/seatTypeService";
import { type SeatType } from "@/types/SeatType/seat";
import { getRoomById, updateRoom } from "@/services/roomService";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function EditRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  const [availableSeatTypes, setAvailableSeatTypes] = useState<SeatType[]>([]);
  const [selectedSeatTypeId, setSelectedSeatTypeId] = useState<string>("");
  const [cinemaId, setCinemaId] = useState<string>(""); // For displaying cinema name (read-only)

  const [formData, setFormData] = useState<UpdateRoomRequest>({
    name: "",
    roomType: RoomType.STANDARD,
    status: RoomStatus.ACTIVE,
    seats: [],
  });

  const { cinemas, loading: loadingCinemas } = useCinemas();
  const {
    seatLayout,
    hasLayout,
    generateSeatLayout,
    updateSeatType,
    clearSeatLayout,
    setSeatLayoutFromSeats,
  } = useSeatLayout();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [seatRowsInput, setSeatRowsInput] = useState(0);
  const [seatsPerRowInput, setSeatsPerRowInput] = useState(0);

  const realTotalSeats = seatLayout.seats.length;

  // Fetch seat types on mount
  useEffect(() => {
    const fetchType = async () => {
      try {
        const types = await getAllSeatTypes();
        setAvailableSeatTypes(types);
        if (types.length > 0) {
          const standardType = types.find(
            (t) => t.typeName.toLocaleUpperCase() === RoomType.STANDARD
          );
          setSelectedSeatTypeId(standardType ? standardType.id : types[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch seat types:", error);
      }
    };
    fetchType();
  }, []);

  // Fetch room data on mount
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!id) {
        navigate(ROUTES.ROOMS);
        return;
      }

      try {
        setInitialLoading(true);
        const roomData = await getRoomById(id);
        console.log("Fetched room data:", roomData);

        // Populate form with existing data
        setFormData({
          name: roomData.name,
          roomType: roomData.roomType as RoomType,
          status: roomData.status as RoomStatus,
          seats: roomData.seats || [],
        });

        // Store cinemaId separately
        setCinemaId(roomData.cinemaId);

        // Load seat layout from existing seats
        if (roomData.seats && roomData.seats.length > 0) {
          setSeatLayoutFromSeats(roomData.seats);

          // Calculate rows and columns for display
          const maxRow = Math.max(
            ...roomData.seats.map((s) => {
              const charCode = s.rowChair.charCodeAt(0) - "A".charCodeAt(0);
              return charCode + 1;
            })
          );
          const maxCol = Math.max(...roomData.seats.map((s) => s.seatNumber));

          setSeatRowsInput(maxRow);
          setSeatsPerRowInput(maxCol);
        }
      } catch (error) {
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to load room data",
        });
        navigate(ROUTES.ROOMS);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchRoomData();
  }, [id]);

  const handleInputChange = (
    field: keyof UpdateRoomRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDimensionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "rows" | "seatsPerRow"
  ) => {
    const rawValue = e.target.value;
    let value = rawValue === "" ? 0 : parseInt(rawValue);
    if (isNaN(value)) return;
    const MAX_VAL = field === "rows" ? 20 : 30;
    if (value > MAX_VAL) value = MAX_VAL;
    if (field === "rows") {
      setSeatRowsInput(value);
    } else {
      setSeatsPerRowInput(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!hasLayout || realTotalSeats === 0) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          "Please generate a valid seat layout before updating the room.",
      });
      return;
    }

    try {
      setLoading(true);
      const formattedSeats = seatLayout.seats.map((seat) => ({
        rowChair: seat.rowChair,
        seatNumber: seat.seatNumber,
        seatTypeId: seat.seatTypeId,
      }));

      const roomData: UpdateRoomRequest = {
        name: formData.name,
        roomType: formData.roomType,
        status: formData.status,
        seats: formattedSeats,
      };

      console.log("Room Data to be submitted:", roomData);
      await updateRoom(id, roomData);

      addNotification({
        type: "success",
        title: "Success",
        message: "Room updated successfully!",
      });

      // Refresh room data to show updates
      const updatedRoom = await getRoomById(id);
      setFormData({
        name: updatedRoom.name,
        roomType: updatedRoom.roomType as RoomType,
        status: updatedRoom.status as RoomStatus,
        seats: updatedRoom.seats || [],
      });

      // Reload seat layout to reflect changes
      if (updatedRoom.seats && updatedRoom.seats.length > 0) {
        setSeatLayoutFromSeats(updatedRoom.seats);
      }
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to update room",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.ROOMS);
  };

  const handleGenerateLayout = () => {
    if (!selectedSeatTypeId) return;
    generateSeatLayout(seatRowsInput, seatsPerRowInput, selectedSeatTypeId);
  };

  if (initialLoading) {
    return <LoadingSpinner message="Loading room..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Update Room</h1>
          <p className="text-muted-foreground mt-1">
            Update room details and seat configuration.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Room Information
            </CardTitle>
            <CardDescription>
              Update the details below to modify the room.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Room Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter room name (e.g., Screen 1, Hall A)"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              {/* Cinema Selection (Disabled for Edit) */}
              <div className="space-y-2">
                <Label htmlFor="cinema">Cinema</Label>
                <Input
                  id="cinema"
                  type="text"
                  placeholder="Cinema"
                  value={cinemas.find((c) => c.id === cinemaId)?.name || ""}
                  disabled
                  readOnly
                />
                <p className="text-sm text-muted-foreground">
                  Cinema cannot be changed after room creation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Room Type */}
                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type *</Label>
                  <Select
                    value={formData.roomType}
                    onValueChange={(value: RoomType) =>
                      handleInputChange("roomType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RoomType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Room Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Room Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RoomStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seat Layout Configuration */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Seat Layout Configuration
                </Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rows">Number of Rows</Label>
                    <Input
                      id="rows"
                      type="number"
                      min="1"
                      max="20"
                      value={seatRowsInput === 0 ? "" : seatRowsInput}
                      onChange={(e) => onDimensionChange(e, "rows")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seatsPerRow">Seats per Row</Label>
                    <Input
                      id="seatsPerRow"
                      type="number"
                      min="1"
                      max="30"
                      value={seatsPerRowInput === 0 ? "" : seatsPerRowInput}
                      onChange={(e) => onDimensionChange(e, "seatsPerRow")}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateLayout}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Regenerate Seat Layout
                  </Button>

                  {hasLayout && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSeatLayout}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Layout
                    </Button>
                  )}
                </div>

                {/* Seat Type Selection */}
                {hasLayout ? (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <SeatLayoutEditor
                      layout={seatLayout}
                      seatTypes={availableSeatTypes}
                      selectedTypeId={selectedSeatTypeId}
                      onTypeChange={setSelectedSeatTypeId}
                      onSeatClick={(id) =>
                        updateSeatType(id, selectedSeatTypeId)
                      }
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-gray-50 text-muted-foreground">
                    <Sofa className="h-10 w-10 mb-2 opacity-50" />
                    <p>
                      Enter rows and columns, then click "Regenerate" to update
                      seats.
                    </p>
                  </div>
                )}
              </div>

              {/* Total Seats (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="totalSeats">Total Seats *</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  placeholder="Total seats"
                  value={realTotalSeats}
                  readOnly
                />

                <p className="text-sm text-muted-foreground">
                  Total seats calculated from seat layout
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading || loadingCinemas || initialLoading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Update Room
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
