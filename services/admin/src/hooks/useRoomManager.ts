import { useState, useCallback } from "react";

import { useNotificationStore } from "@/stores";
import { getAllRooms} from "@/services/roomService";
import type { Room } from "@/types/RoomType/room";

export function useRoomManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving] = useState(false);

  // const { confirmDialog, showConfirmDialog, closeConfirmDialog, confirmAndClose } = useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load rooms
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const roomsData = await getAllRooms();
      setRooms(roomsData);
    }
    catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  return{
    rooms,
    loading,
    saving,
    loadData,
  }
}