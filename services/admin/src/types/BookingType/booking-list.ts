export interface BookingListItem {
  id: string;
  bookingCode: string;
  customerId: string | null;
  customerName: string;
  email: string;
  phone: string;
  movieTitle: string;
  roomName: string;
  screeningTime: string;
  seatCount: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRM' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  expiredAt: string | null;
}

export interface BookingListResponse {
  bookings: BookingListItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
