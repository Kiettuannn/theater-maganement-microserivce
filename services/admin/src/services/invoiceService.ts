import httpClient from "@/configurations/httpClient";
import type {
  InvoiceResponse,
  InvoiceDetailResponse,
  InvoiceStatisticsResponse,
  InvoiceFilterParams,
  PaginatedInvoiceResponse,
  InvoiceStatus,
} from "@/types/InvoiceType/invoice";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

// payment-service qua gateway: /payment/invoices
const BASE_URL = "/payment/invoices";

export const getAllInvoices = async (
  page: number = 0,
  size: number = 10,
  cinemaId?: string
): Promise<PaginatedInvoiceResponse> => {
  return handleApiResponse<PaginatedInvoiceResponse>(
    httpClient.get<ApiResponse<PaginatedInvoiceResponse>>(BASE_URL, {
      params: { page, size, cinemaId },
    })
  );
};

export const getInvoiceById = async (
  invoiceId: string
): Promise<InvoiceResponse> => {
  return handleApiResponse<InvoiceResponse>(
    httpClient.get<ApiResponse<InvoiceResponse>>(`${BASE_URL}/${invoiceId}`)
  );
};

export const getInvoiceDetail = async (
  invoiceId: string
): Promise<InvoiceDetailResponse> => {
  return handleApiResponse<InvoiceDetailResponse>(
    httpClient.get<ApiResponse<InvoiceDetailResponse>>(
      `${BASE_URL}/${invoiceId}/detail`
    )
  );
};

export const getInvoiceByBookingId = async (
  bookingId: string
): Promise<InvoiceResponse> => {
  return handleApiResponse<InvoiceResponse>(
    httpClient.get<ApiResponse<InvoiceResponse>>(
      `${BASE_URL}/booking/${bookingId}`
    )
  );
};

export const getInvoicesByStatus = async (
  status: InvoiceStatus,
  page: number = 0,
  size: number = 10,
  cinemaId?: string
): Promise<PaginatedInvoiceResponse> => {
  return handleApiResponse<PaginatedInvoiceResponse>(
    httpClient.get<ApiResponse<PaginatedInvoiceResponse>>(
      `${BASE_URL}/status/${status}`,
      {
        params: { page, size, cinemaId },
      }
    )
  );
};

export const searchInvoices = async (
  filters: InvoiceFilterParams
): Promise<PaginatedInvoiceResponse> => {
  const { page = 0, size = 10, search, status, cinemaId } = filters;

  if (search) {
    return handleApiResponse<PaginatedInvoiceResponse>(
      httpClient.get<ApiResponse<PaginatedInvoiceResponse>>(
        `${BASE_URL}/search`,
        {
          params: { query: search, status, page, size, cinemaId },
        }
      )
    );
  }

  if (status) {
    return getInvoicesByStatus(status, page, size, cinemaId);
  }

  return getAllInvoices(page, size, cinemaId);
};

export const getInvoicesByDateRange = async (
  startDate: string,
  endDate: string,
  page: number = 0,
  size: number = 10,
  cinemaId?: string
): Promise<PaginatedInvoiceResponse> => {
  return handleApiResponse<PaginatedInvoiceResponse>(
    httpClient.get<ApiResponse<PaginatedInvoiceResponse>>(
      `${BASE_URL}/date-range`,
      {
        params: { startDate, endDate, page, size, cinemaId },
      }
    )
  );
};

export const getInvoiceStatistics =
  async (cinemaId?: string): Promise<InvoiceStatisticsResponse> => {
    return handleApiResponse<InvoiceStatisticsResponse>(
      httpClient.get<ApiResponse<InvoiceStatisticsResponse>>(
        `${BASE_URL}/statistics`,
        {
          params: { cinemaId },
        }
      )
    );
  };

export const updateInvoiceStatus = async (
  invoiceId: string,
  status: InvoiceStatus
): Promise<InvoiceResponse> => {
  return handleApiResponse<InvoiceResponse>(
    httpClient.patch<ApiResponse<InvoiceResponse>>(
      `${BASE_URL}/${invoiceId}/status`,
      null,
      {
        params: { status },
      }
    )
  );
};
