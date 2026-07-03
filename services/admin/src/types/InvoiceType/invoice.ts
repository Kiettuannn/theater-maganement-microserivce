// Invoice Status Type
export const InvoiceStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

// Base Invoice Response
export interface InvoiceResponse {
  id: string;
  bookingId: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
}

// Invoice Detail with Booking Info
export interface InvoiceDetailResponse {
  id: string;
  bookingId: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
  bookingDetails: {
    bookingId: string;
    status: string;
    expiredAt: string;
    seats: Array<{
      id: string;
      seatName: string;
      rowChair: string;
      seatNumber: number;
      seatTypeId: string;
    }>;
    combos: Array<{
      comboId: string;
      comboName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    startTime: string;
    seatSubtotal: number;
    comboSubtotal: number;
    subTotal: number;
    discountAmount: number;
    totalAmount: number;
    movie: {
      id: string;
      title: string;
      posterUrl?: string;
      genres?: string[];
      duration?: number;
    };
  };
}

// Invoice Statistics
export interface InvoiceStatisticsResponse {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  failedInvoices: number;
  refundedInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  refundedAmount: number;
}

// Invoice Filter Params
export interface InvoiceFilterParams {
  page?: number;
  size?: number;
  status?: InvoiceStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  cinemaId?: string;
}

// Paginated Response
export interface PaginatedInvoiceResponse {
  content: InvoiceResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
