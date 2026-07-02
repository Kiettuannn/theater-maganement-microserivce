import { useState, useEffect } from "react";
import { getSeatsByShowtime, getAvailableSeatsByShowtime, type SeatReservation } from "../services/booking";
import type { Showtime } from "../services/showtime";

export const useSeats = (showtimeId: string | null) => {
  const [seats, setSeats] = useState<SeatReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showtimeId) {
      setSeats([]);
      return;
    }
    setLoading(true);
    getSeatsByShowtime(showtimeId)
      .then(setSeats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [showtimeId]);

  return { seats, loading, error };
};

export type ShowtimeDetail = {
  availableSeats: number;
  price: number;
};

export const useShowtimeDetails = (showtimes: Showtime[]) => {
  const [details, setDetails] = useState<Record<string, ShowtimeDetail>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showtimes || showtimes.length === 0) {
      setDetails({});
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchDetails = async () => {
      const newDetails: Record<string, ShowtimeDetail> = {};
      
      try {
        await Promise.all(
          showtimes.map(async (st) => {
            try {
              const availableSeats = await getAvailableSeatsByShowtime(st.id);
              if (!isMounted) return;
              
              const rawPrice = availableSeats.length > 0 ? availableSeats[0].price : 0;
              
              newDetails[st.id] = {
                availableSeats: availableSeats.length,
                price: rawPrice === 1 ? 0 : rawPrice,
              };
            } catch (err) {
              console.error(`Failed to fetch seats for showtime ${st.id}`, err);
              newDetails[st.id] = { availableSeats: 0, price: 120000 };
            }
          })
        );

        if (isMounted) {
          setDetails(newDetails);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [showtimes]);

  return { details, loading };
};
