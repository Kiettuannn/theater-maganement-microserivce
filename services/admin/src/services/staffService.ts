import type { StaffProfile } from "@/types/StaffType/StaffProfile";

// DISABLED: /staffs endpoint đã bị loại bỏ trong microservice.
// Identity-service chỉ còn /users (không có staffs riêng biệt).
// Các stub dưới đây giữ nguyên interface để build không lỗi.

export interface StaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  jobTitle: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  username: string;
  password?: string;
  cinemaId?: string;
  roles?: string[];
}

const _warn = (fn: string) => console.warn(`[DISABLED] staffService.${fn} — endpoint removed in microservice`);

export const getMyInfo = async (): Promise<StaffProfile> => { _warn("getMyInfo"); return {} as StaffProfile; };
export const updateMyInfo = async (_staffId: string, _data: any): Promise<StaffProfile> => { _warn("updateMyInfo"); return {} as StaffProfile; };
export const getAllStaffs = async (): Promise<StaffProfile[]> => { _warn("getAllStaffs"); return []; };
export const getStaffById = async (_staffId: string): Promise<StaffProfile> => { _warn("getStaffById"); return {} as StaffProfile; };
export const createStaff = async (_request: StaffRequest): Promise<StaffProfile> => { _warn("createStaff"); return {} as StaffProfile; };
export const updateStaff = async (_staffId: string, _request: Partial<StaffRequest>): Promise<StaffProfile> => { _warn("updateStaff"); return {} as StaffProfile; };
export const deleteStaff = async (_staffId: string): Promise<void> => { _warn("deleteStaff"); };
export const searchStaffs = async (_keyword: string): Promise<StaffProfile[]> => { _warn("searchStaffs"); return []; };
export const getStaffsByCinemaWithRoleStaff = async (_cinemaId: string): Promise<StaffProfile[]> => { _warn("getStaffsByCinemaWithRoleStaff"); return []; };
export const getAvailableManagers = async (): Promise<StaffProfile[]> => { _warn("getAvailableManagers"); return []; };