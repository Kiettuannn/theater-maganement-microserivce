import type { CustomerProfile } from "@/types/CustomerType/CustomerProfile";

// DISABLED: /customers endpoint đã bị loại bỏ trong microservice.
// Các stub dưới đây giữ nguyên interface để build không lỗi.

export interface CustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  username: string;
  password: string;
}

const _warn = (fn: string) => console.warn(`[DISABLED] customerService.${fn} — endpoint removed in microservice`);

export const getMyInfo = async (): Promise<CustomerProfile> => { _warn("getMyInfo"); return {} as CustomerProfile; };
export const getAllCustomers = async (): Promise<CustomerProfile[]> => { _warn("getAllCustomers"); return []; };
export const createCustomer = async (_request: CustomerRequest): Promise<CustomerProfile> => { _warn("createCustomer"); return {} as CustomerProfile; };
export const getCustomerById = async (_customerId: string): Promise<CustomerProfile> => { _warn("getCustomerById"); return {} as CustomerProfile; };
export const updateCustomer = async (_customerId: string, _request: Partial<CustomerRequest>): Promise<CustomerProfile> => { _warn("updateCustomer"); return {} as CustomerProfile; };
export const deleteCustomer = async (_customerId: string): Promise<void> => { _warn("deleteCustomer"); };
export const getCustomerLoyaltyPoints = async (_customerId: string): Promise<number> => { _warn("getCustomerLoyaltyPoints"); return 0; };


// // Get current user info
// export const getMyInfo = async (): Promise<CustomerProfile> => {
//   return handleApiResponse<CustomerProfile>(
//     httpClient.get<ApiResponse<CustomerProfile>>(`${BASE_URL}/myInfo`)
//   );
// };

// // Customer Management APIs

// export const getAllCustomers = async (): Promise<CustomerProfile[]> => {
//   return handleApiResponse<CustomerProfile[]>(
//     httpClient.get<ApiResponse<CustomerProfile[]>>(BASE_URL)
//   );
// };

// export const createCustomer = async (
//   request: CustomerRequest
// ): Promise<CustomerProfile> => {
//   return handleApiResponse<CustomerProfile>(
//     httpClient.post<ApiResponse<CustomerProfile>>(`${BASE_URL}`, request)
//   );
// };

// export const getCustomerById = async (customerId: string): Promise<CustomerProfile> => {
//   return handleApiResponse<CustomerProfile>(
//     httpClient.get<ApiResponse<CustomerProfile>>(`${BASE_URL}/${customerId}`)
//   );
// };

// export const updateCustomer = async (
//   customerId: string,
//   request: Partial<CustomerRequest>
// ): Promise<CustomerProfile> => {
//   return handleApiResponse<CustomerProfile>(
//     httpClient.put<ApiResponse<CustomerProfile>>(`${BASE_URL}/${customerId}`, request)
//   );
// };

// export const deleteCustomer = async (customerId: string): Promise<void> => {
//   await httpClient.delete(`${BASE_URL}/${customerId}`);
// };

// // Get customer loyalty points
// export const getCustomerLoyaltyPoints = async (customerId: string): Promise<number> => {
//   const response = await handleApiResponse<{ loyaltyPoints?: number }>(
//     httpClient.get<ApiResponse<{ loyaltyPoints?: number }>>(
//       `${BASE_URL}/${customerId}/loyalty-points`
//     )
//   );
//   return response?.loyaltyPoints ?? 0;
// };

