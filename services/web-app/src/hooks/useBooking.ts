import { useState } from 'react';

export interface BookingState {
  movieId: string | null;
  date: string | null;
  cinemaId: string | null;
  showtimeId: string | null;
  showtimeTime?: string;
  selectedSeats: string[];
  totalPrice: number;
  movieTitle?: string;
  cinemaName?: string;
}

export const useBooking = () => {
  const [booking, setBooking] = useState<BookingState>(() => {
    const saved = localStorage.getItem('booking');
    return saved
      ? JSON.parse(saved)
      : {
          movieId: null,
          date: null,
          cinemaId: null,
          showtimeId: null,
          selectedSeats: [],
          totalPrice: 0,
        };
  });

  const updateBooking = (updates: Partial<BookingState>) => {
    const newBooking = { ...booking, ...updates };
    setBooking(newBooking);
    localStorage.setItem('booking', JSON.stringify(newBooking));
  };

  const resetBooking = () => {
    const initialState = {
      movieId: null,
      date: null,
      cinemaId: null,
      showtimeId: null,
      selectedSeats: [],
      totalPrice: 0,
    };
    setBooking(initialState);
    localStorage.removeItem('booking');
  };

  return {
    booking,
    updateBooking,
    resetBooking,
  };
};
