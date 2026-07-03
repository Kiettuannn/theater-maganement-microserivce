import type { Seat, SeatLayout } from "@/types/SeatType/seat";
import { getRowLetter } from "@/utils/seatUtils";
import { useState } from "react";

export function useSeatLayout() {
  const [seatLayout, setSeatLayout] = useState<SeatLayout>({
    rows: 0,
    seatsPerRow: 0,
    seats: [],
  })

  
  const hasLayout = seatLayout.seats.length > 0;

  const generateSeatLayout = (rows: number, seatsPerRow: number, defaultTypeId: string) => {
    const seats: Seat[] = [];
    for(let row = 0; row < rows; row++) {
      const rowLetter = getRowLetter(row);
      for(let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
        seats.push({
          id: `${rowLetter}${seatNum}`,
          rowChair: rowLetter,
          seatNumber: seatNum,
          seatTypeId: defaultTypeId,
          available: true,
        });
      }
    }

    setSeatLayout({ 
      rows: rows, 
      seatsPerRow: seatsPerRow,
      seats
     });
  }

  const updateSeatType = (seatId: string, newTypeId: string) => {
    setSeatLayout((prevLayout) => ({
      ...prevLayout,
      seats: prevLayout.seats.map((seat) => 
        seat.id === seatId ? { ...seat, seatTypeId: newTypeId } : seat) 
    }))
  }

  const clearSeatLayout = () => {
    setSeatLayout({
      rows: 0,
      seatsPerRow: 0,
      seats: [],
    });
  }

  const setSeatLayoutFromSeats = (seats: Seat[]) => {
    if (seats.length === 0) {
      clearSeatLayout();
      return;
    }
    
    // Calculate rows and seatsPerRow from seats
    const uniqueRows = [...new Set(seats.map(s => s.rowChair))];
    const rows = uniqueRows.length;
    const seatsPerRow = Math.max(...seats.map(s => s.seatNumber));
    
    setSeatLayout({
      rows,
      seatsPerRow,
      seats: seats.map(s => ({
        id: `${s.rowChair}${s.seatNumber}`,
        rowChair: s.rowChair,
        seatNumber: s.seatNumber,
        seatTypeId: s.seatTypeId,
        available: true,
      }))
    });
  }

  return{
    seatLayout,
    hasLayout,
    generateSeatLayout,
    updateSeatType,
    clearSeatLayout,
    setSeatLayoutFromSeats,
  }
}