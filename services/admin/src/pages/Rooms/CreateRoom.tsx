import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Sofa, Plus, Trash2 } from "lucide-react";
import { useNotificationStore } from "@/stores";
import { RoomStatus, RoomType } from "@/types/RoomType/room";
import { ROUTES } from "@/constants/routes";
import type { CreateRoomRequest } from "@/types/RoomType/room";
import { useSeatLayout } from "@/hooks/useSeatLayout";
import { SeatLayoutEditor } from "@/components/rooms/SeatLayoutEditor";
import { getAllSeatTypes } from "@/services/seatTypeService";
import { type SeatType } from "@/types/SeatType/seat";
import { createRoom } from "@/services/roomService";

export function CreateRoom() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const [availableSeatTypes, setAvailableSeatTypes] = useState<SeatType[]>([]);
  const [selectedSeatTypeId, setSelectedSeatTypeId] = useState<string>("");

  useEffect(() => {
    const fetchType = async () => {
      try {
        const types = await getAllSeatTypes();
        setAvailableSeatTypes(types);
        if (types.length > 0) {
          const standardType = types.find(
            (t) => t.typeName.toLocaleUpperCase() === RoomType.STANDARD,
          );
          setSelectedSeatTypeId(standardType ? standardType.id : types[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch seat types:", error);
      }
    };
    fetchType();
  }, []);

  const [formData, setFormData] = useState<CreateRoomRequest>({
    name: "",
    roomType: RoomType.STANDARD,
    status: RoomStatus.ACTIVE,
    seats: [],
  });

  const {
    seatLayout,
    hasLayout,
    generateSeatLayout,
    updateSeatType,
    clearSeatLayout,
  } = useSeatLayout();

  const [loading, setLoading] = useState(false);
  const [seatRowsInput, setSeatRowsInput] = useState(0);
  const [seatsPerRowInput, setSeatsPerRowInput] = useState(0);

  const realTotalSeats = seatLayout.seats.length;

  const handleInputChange = (
    field: keyof CreateRoomRequest,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDimensionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "rows" | "seatsPerRow",
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

  const handleGenerateLayout = () => {
    if (!selectedSeatTypeId) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please select a seat type first.",
      });
      return;
    }
    if (seatRowsInput <= 0 || seatsPerRowInput <= 0) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please enter valid number of rows and seats per row.",
      });
      return;
    }
    generateSeatLayout(seatRowsInput, seatsPerRowInput, selectedSeatTypeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addNotification({ type: "error", title: "Error", message: "Room name is required." });
      return;
    }

    if (!hasLayout || realTotalSeats === 0) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please generate a valid seat layout before creating the room.",
      });
      return;
    }

    try {
      setLoading(true);
      const roomData: CreateRoomRequest = {
        name: formData.name,
        roomType: formData.roomType,
        status: formData.status,
        seats: seatLayout.seats.map((seat) => ({
          rowChair: seat.rowChair,
          seatNumber: seat.seatNumber,
          seatTypeId: seat.seatTypeId,
        })),
      };

      console.log("Room Data to be submitted:", roomData);
      await createRoom(roomData);

      addNotification({
        type: "success",
        title: "Success",
        message: "Room created successfully!",
      });

      navigate(ROUTES.ROOMS);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to create room",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Create New Room</h1>
          <p className="text-muted-foreground mt-1">Add a new room to your theater.</p>
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
            <CardDescription>Fill in the details below to create a new room.</CardDescription>
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
                  required
                />
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
                    onValueChange={(value) => handleInputChange("status", value)}
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
                <Label className="text-lg font-semibold">Seat Layout Configuration</Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rows">Number of Rows (max 20)</Label>
                    <Input
                      id="rows"
                      type="number"
                      min="1"
                      max="20"
                      placeholder="e.g. 5"
                      value={seatRowsInput === 0 ? "" : seatRowsInput}
                      onChange={(e) => onDimensionChange(e, "rows")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seatsPerRow">Seats per Row (max 30)</Label>
                    <Input
                      id="seatsPerRow"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="e.g. 10"
                      value={seatsPerRowInput === 0 ? "" : seatsPerRowInput}
                      onChange={(e) => onDimensionChange(e, "seatsPerRow")}
                    />
                  </div>
                </div>

                {/* Default Seat Type */}
                <div className="space-y-2">
                  <Label>Default Seat Type</Label>
                  <Select
                    value={selectedSeatTypeId}
                    onValueChange={setSelectedSeatTypeId}
                    disabled={availableSeatTypes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default seat type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSeatTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.typeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateLayout}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Generate Seat Layout
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

                {/* Seat Editor or placeholder */}
                {hasLayout ? (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <SeatLayoutEditor
                      layout={seatLayout}
                      seatTypes={availableSeatTypes}
                      selectedTypeId={selectedSeatTypeId}
                      onTypeChange={setSelectedSeatTypeId}
                      onSeatClick={(id) => updateSeatType(id, selectedSeatTypeId)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30 text-muted-foreground">
                    <Sofa className="h-10 w-10 mb-2 opacity-50" />
                    <p>Enter rows and columns, then click "Generate Seat Layout".</p>
                  </div>
                )}
              </div>

              {/* Total Seats (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="totalSeats">Total Seats</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  value={realTotalSeats}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Auto-calculated from seat layout ({seatRowsInput} rows × {seatsPerRowInput} seats)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Room
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(ROUTES.ROOMS)}
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
