import { api } from "./api";

export interface CreateServicePayload {
  name: string;
  description: string;
  price: number;
}

export interface ServiceResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  providerId: string;
  createdAt: string;
  updatedAt: string;
}

export const servicesService = {
  create: async (data: CreateServicePayload) => {
    const response = await api.post<ServiceResponse>("/api/v1/services", data);
    return response.data;
  },

  getMyServices: async () => {
    const response = await api.get<ServiceResponse[]>("/api/v1/services/my-services");
    return response.data;
  },

  getAll: async () => {
    const response = await api.get<ServiceResponse[]>("/api/v1/services");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ServiceResponse>(`/api/v1/services/${id}`);
    return response.data;
  },

  update: async (id: string, data: CreateServicePayload) => {
    const response = await api.put<ServiceResponse>(`/api/v1/services/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/v1/services/${id}`);
    return response.data || { success: true };
  },
};
