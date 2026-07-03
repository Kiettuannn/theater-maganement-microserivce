import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getRoomsByCinema } from "@/services/roomService";
import {
  getEquipmentByRoom,
  getAllCategories,
  type Equipment,
  type EquipmentCategory,
} from "@/services/equipmentService";
import { getAllCinemas, type Cinema } from "@/services/cinemaService";
import EquipmentListDetail from "./EquipmentListDetail";
import { useAuthStore } from "@/stores";

interface Room {
  id: string;
  name: string;
  cinemaId: string;
}

export function EquipmentList() {
  const { cinemaId } = useAuthStore();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomEquipment, setRoomEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    // Check if user is a manager (has cinemaId)
    if (cinemaId) {
      setIsManager(true);
      // Auto-select the manager's cinema
      autoSelectManagerCinema();
    } else {
      setIsManager(false);
      fetchCinemas();
    }
    fetchCategories();
  }, [cinemaId]);

  const autoSelectManagerCinema = async () => {
    if (!cinemaId) return;
    
    try {
      setLoading(true);
      setError(null);
      // Fetch all cinemas to get the cinema object
      const allCinemas = await getAllCinemas();
      const managerCinema = allCinemas.find((c: Cinema) => c.id === cinemaId);
      
      if (managerCinema) {
        setSelectedCinema(managerCinema);
        await fetchRooms(managerCinema.id);
      } else {
        setError("Your assigned cinema was not found.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load your cinema");
      console.error("Error loading manager cinema:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const cinemas = await getAllCinemas();
      setCinemas(cinemas);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load cinemas");
      console.error("Error fetching cinemas:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (cinemaId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching rooms for cinema:", cinemaId);
      const response = await getRoomsByCinema(cinemaId);
      console.log("Rooms response:", response);
      const rooms = response.data?.result || response.data || [];
      setRooms(rooms);
    } catch (err: any) {
      console.error("Error fetching rooms:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to load rooms";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      const categories = response.data?.result || response.data || [];
      setCategories(categories);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleCinemaSelect = async (cinema: Cinema) => {
    setSelectedCinema(cinema);
    setRooms([]);
    setSelectedRoom(null);
    setError(null);
    console.log("Selected cinema:", cinema);
    try {
      await fetchRooms(cinema.id);
    } catch (err) {
      console.error("Error in handleCinemaSelect:", err);
    }
  };

  const handleRoomClick = async (room: Room) => {
    try {
      setSelectedRoom(room);
      setLoading(true);
      const response = await getEquipmentByRoom(room.id);
      const equipment = response.data?.result || response.data || [];
      setRoomEquipment(equipment);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load equipment");
      console.error("Error fetching equipment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setRoomEquipment([]);
  };

  const handleBackToCinemas = () => {
    setSelectedCinema(null);
    setRooms([]);
    setSelectedRoom(null);
    setRoomEquipment([]);
  };

  const handleEquipmentUpdated = async () => {
    if (selectedRoom) {
      try {
        const response = await getEquipmentByRoom(selectedRoom.id);
        setRoomEquipment(response.data || []);
      } catch (err) {
        console.error("Error refreshing equipment:", err);
      }
    }
  };

  // View: Equipment List (when room is selected)
  if (selectedRoom && selectedCinema) {
    return (
      <EquipmentListDetail
        room={selectedRoom}
        equipment={roomEquipment}
        categories={categories}
        loading={loading}
        error={error}
        onBack={handleBackToRooms}
        onEquipmentUpdated={handleEquipmentUpdated}
      />
    );
  }

  // View: Room List (when cinema is selected)
  if (selectedCinema) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Equipment Management"
          description={`Managing equipment for ${selectedCinema.name}`}
        />
        {!isManager && (
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBackToCinemas}
              variant="ghost"
              className="text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Cinemas
            </Button>
          </div>
        )}

         <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">{selectedCinema.name} - Screening Rooms</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rooms found. Please add rooms first.
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleRoomClick(room)}
                  className="flex items-center justify-between p-5 bg-white border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{room.name}</h3>
                    <p className="text-sm text-gray-500">Click to manage equipment</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // View: Cinema List (default)
  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Management"
        description="Select a cinema to manage its equipment"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Cinemas</h2>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : cinemas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No cinemas found. Please add cinemas first.
          </div>
        ) : (
          <div className="space-y-3">
            {cinemas.map((cinema) => (
              <div
                key={cinema.id}
                onClick={() => handleCinemaSelect(cinema)}
                className="flex items-center justify-between p-5 bg-white border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              >
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{cinema.name}</h3>
                  <p className="text-sm text-gray-500">Click to view rooms</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
