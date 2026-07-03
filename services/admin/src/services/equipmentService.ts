import httpClient from "@/configurations/httpClient";

export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  categoryId: string;
  roomId: string;
  serialNumber?: string;
  status: string;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentRequest {
  name: string;
  categoryId: string;
  roomId: string;
  serialNumber?: string;
  status: string;
  purchaseDate?: string;
}

export interface UpdateEquipmentRequest {
  name?: string;
  categoryId?: string;
  roomId?: string;
  serialNumber?: string;
  status?: string;
  purchaseDate?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

// Equipment Endpoints
export const getAllEquipment = async () => {
  return await httpClient.get(`/equipments`);
};

export const getEquipmentById = async (equipmentId: string) => {
  return await httpClient.get(`/equipments/${equipmentId}`);
};

export const getEquipmentByRoom = async (roomId: string) => {
  return await httpClient.get(`/equipments/room/${roomId}`);
};

export const getEquipmentByCategory = async (categoryId: string) => {
  return await httpClient.get(`/equipments/category/${categoryId}`);
};

export const getEquipmentByStatus = async (status: string) => {
  return await httpClient.get(`/equipments/status/${status}`);
};

export const createEquipment = async (data: CreateEquipmentRequest) => {
  return await httpClient.post(`/equipments`, data);
};

export const updateEquipment = async (
  equipmentId: string,
  data: UpdateEquipmentRequest
) => {
  return await httpClient.put(`/equipments/${equipmentId}`, data);
};

export const deleteEquipment = async (equipmentId: string) => {
  return await httpClient.delete(`/equipments/${equipmentId}`);
};

// Equipment Category Endpoints
export const getAllCategories = async () => {
  return await httpClient.get(`/equipment-categories`);
};

export const getCategoryById = async (categoryId: string) => {
  return await httpClient.get(`/equipment-categories/${categoryId}`);
};

export const createCategory = async (data: CreateCategoryRequest) => {
  return await httpClient.post(`/equipment-categories`, data);
};

export const updateCategory = async (
  categoryId: string,
  data: UpdateCategoryRequest
) => {
  return await httpClient.put(`/equipment-categories/${categoryId}`, data);
};

export const deleteCategory = async (categoryId: string) => {
  return await httpClient.delete(`/equipment-categories/${categoryId}`);
};
