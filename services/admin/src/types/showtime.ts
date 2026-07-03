export interface Showtime {
  id: string;
  movieTitle: string;
  date: string;
  time: string;
  room: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
}

export interface ShowtimeFilters {
  room?: string;
  date?: string;
  searchQuery?: string;
  sortBy?: 'startTime-asc' | 'startTime-desc' | 'created';
}
