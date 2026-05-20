import { api } from "./api";

export interface BookingResponse {
  id: string;
  clientId: string;
  serviceId: string;
  status: string;
  scheduledAt: string;
  createdAt: string;
  client?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phone?: string;
  };
  service?: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
}

export const bookingsService = {
  getProviderBookings: async () => {
    const response = await api.get<BookingResponse[]>("/api/v1/bookings/provider/bookings");
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get<BookingResponse[]>("/api/v1/bookings/my-bookings");
    return response.data;
  },

  cancelBooking: async (id: string) => {
    const response = await api.delete<BookingResponse>(`/api/v1/bookings/${id}`);
    return response.data;
  },

  createBooking: async (data: { serviceId: string; scheduledAt: string }) => {
    const response = await api.post<BookingResponse>("/api/v1/bookings", data);
    return response.data;
  },
};
