
// Data from backend
export interface SeatType{
  id: string;
  typeName: string;
  basePriceModifier: number;
}

// Data used in frontend
export interface Seat{
  id: string; // Ex: A1, B3
  rowChair: string;
  seatNumber: number;
  seatTypeId: string;

  available?: boolean;
}

export interface SeatLayout {
  rows: number;
  seatsPerRow: number;
  seats: Seat[];
}
