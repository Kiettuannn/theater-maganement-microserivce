import httpClient from "@/configurations/httpClient";

export interface WorkScheduleResponse {
  id: string;
  userId: string;
  userName: string;
  shiftTypeId: string;
  shiftTypeName: string;
  shiftStart: string;
  shiftEnd: string;
  workDate: string;
}

export interface ShiftTemplate {
  id: string;
  cinemaId: string;
  name: string;
  startTime: string;
  endTime: string;
  deleted?: boolean;
}

export interface CreateShiftTemplatePayload {
  name: string;
  startTime: string;
  endTime: string;
}

export interface UpdateShiftTemplatePayload {
  name?: string;
  startTime?: string;
  endTime?: string;
}

const cinemaPath = (cinemaId: string) => `/cinemas/${cinemaId}`;

export const workScheduleService = {
  async getSchedules(cinemaId: string, from: string, to: string) {
    const response = await httpClient.get(
      `${cinemaPath(cinemaId)}/schedules`,
      { params: { from, to } }
    );
    return response.data?.result as WorkScheduleResponse[];
  },

  async createSchedules(cinemaId: string, payload: { userIds: string[]; shiftTypeId: string; workDate: string }) {
    const response = await httpClient.post(`${cinemaPath(cinemaId)}/schedules`, payload);
    return response.data?.result as WorkScheduleResponse[];
  },

  async updateShiftInstance(
    cinemaId: string,
    shiftTypeId: string,
    workDate: string,
    payload: { shiftTypeId?: string; workDate?: string }
  ) {
    const response = await httpClient.put(
      `${cinemaPath(cinemaId)}/schedules/shifts/${shiftTypeId}/date/${workDate}`,
      payload
    );
    return response.data?.result as WorkScheduleResponse[];
  },

  async deleteShiftInstance(cinemaId: string, shiftTypeId: string, workDate: string) {
    const response = await httpClient.delete(`${cinemaPath(cinemaId)}/schedules/shifts/${shiftTypeId}/date/${workDate}`);
    return response.data?.result as string;
  },

  async deleteSchedule(cinemaId: string, scheduleId: string) {
    const response = await httpClient.delete(
      `${cinemaPath(cinemaId)}/schedules/${scheduleId}`
    );
    return response.data?.result as string;
  },

  async getShiftTemplates(cinemaId: string) {
    const response = await httpClient.get(
      `${cinemaPath(cinemaId)}/shift-types`
    );
    return response.data?.result as ShiftTemplate[];
  },

  async createShiftTemplate(cinemaId: string, payload: CreateShiftTemplatePayload) {
    const response = await httpClient.post(
      `${cinemaPath(cinemaId)}/shift-types`,
      payload
    );
    return response.data?.result as ShiftTemplate;
  },

  async updateShiftTemplate(
    cinemaId: string,
    shiftId: string,
    payload: UpdateShiftTemplatePayload
  ) {
    const response = await httpClient.put(
      `${cinemaPath(cinemaId)}/shift-types/${shiftId}`,
      payload
    );
    return response.data?.result as ShiftTemplate;
  },

  async deleteShiftTemplate(cinemaId: string, shiftId: string) {
    const response = await httpClient.delete(
      `${cinemaPath(cinemaId)}/shift-types/${shiftId}`
    );
    return response.data?.result as string;
  },
};
