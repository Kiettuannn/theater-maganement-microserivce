import { getAllCinemas } from "@/services/cinemaService";
import { useNotificationStore } from "@/stores";
import type { Cinema } from "@/types/CinemaType/cinemaType";
import { useEffect, useState } from "react";

export function useCinemas() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  )
  // Load cinemas
  useEffect(() => {
    loadCinemas();
  },[]);

  const loadCinemas = async () => {
    try {
      setLoading(true);
      const cinemasData = await getAllCinemas();
      setCinemas(cinemasData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to load cinemas.",
      });
    } finally {
      setLoading(false);
    }
  }
  return{
    cinemas,
    loading,
  }
}