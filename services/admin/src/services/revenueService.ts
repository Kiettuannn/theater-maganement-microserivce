import httpClient from "@/configurations/httpClient";

// DISABLED: /revenue endpoint không tồn tại trong microservice (không có trong payment-api.md, booking-api.md, catalog-api.md).
// Các hàm dưới đây được giữ lại nhưng comment out để không gọi API.

export interface MovieRevenue {
  id: string;
  movieId: string;
  cinemaId: string;
  reportDate: string;
  totalTicketsSold: number;
  totalRevenue: number;
}

export interface DailyRevenueRow {
  id: string;
  cinemaId: string;
  reportDate: string;
  ticketRevenue: number;
  comboRevenue: number;
  netRevenue: number;
  totalTransactions: number;
}

export type ReportType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

export interface RevenueReportRow {
  id: string;
  cinemaId: string;
  reportType: ReportType;
  startDate: string;
  endDate: string;
  totalTicketRevenue: number;
  totalComboRevenue: number;
  netRevenue: number;
  generatedAt: string;
}

// const base = `/revenue`;

// export const revenueService = {
//   async getMovieRevenue(params: {
//     cinemaId?: string;
//     movieId?: string;
//     from?: string;
//     to?: string;
//   }) {
//     const response = await httpClient.get<MovieRevenue[]>(`${base}/movie`, { params });
//     return response.data;
//   },

//   async getDailyRevenue(params: { cinemaId?: string; from?: string; to?: string }) {
//     const response = await httpClient.get<DailyRevenueRow[]>(`${base}/daily`, { params });
//     return response.data;
//   },

//   async getRevenueReports(params: {
//     cinemaId?: string;
//     reportType?: ReportType;
//     from?: string;
//     to?: string;
//   }) {
//     const response = await httpClient.get<RevenueReportRow[]>(`${base}/reports`, { params });
//     return response.data;
//   },

//   async generateReport(payload: {
//     cinemaId: string;
//     reportType: ReportType;
//     startDate: string;
//     endDate: string;
//   }) {
//     const response = await httpClient.post<RevenueReportRow>(`${base}/reports/generate`, payload);
//     return response.data;
//   },
// };

// Placeholder export để tránh lỗi import ở các nơi đang dùng revenueService
export const revenueService = {
  getMovieRevenue: async (_params: any) => { console.warn("revenueService.getMovieRevenue is DISABLED in microservice"); return []; },
  getDailyRevenue: async (_params: any) => { console.warn("revenueService.getDailyRevenue is DISABLED in microservice"); return []; },
  getRevenueReports: async (_params: any) => { console.warn("revenueService.getRevenueReports is DISABLED in microservice"); return []; },
  generateReport: async (_payload: any) => { console.warn("revenueService.generateReport is DISABLED in microservice"); return null; },
};

