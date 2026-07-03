export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  phoneNumber: string;
  buffer?: number | null;
  managerId?: string;
  managerName?: string;
  managerDob?: string;
}

export interface CreateCinemaRequest {
  name: string;
  address: string;
  city: string;
  phoneNumber: string;
  buffer?: number | null;
  managerId?: string | undefined;
}

export interface UpdateCinemaRequest {
  name: string;
  address: string;
  city: string;
  phoneNumber: string;
  buffer?: number | null;
  managerId?: string | undefined;
}

