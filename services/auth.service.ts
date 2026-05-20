import { api } from "./api";

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  nif?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: "CLIENT" | "PROVIDER";
    balance: number;
    nif: string | null;
  };
  access_token: string;
}

export const authService = {
  registerClient: async (data: Omit<RegisterPayload, "nif">) => {
    const response = await api.post<AuthResponse>("/api/v1/auth/register/client", data);
    return response.data;
  },

  registerProvider: async (data: RegisterPayload) => {
    const response = await api.post<AuthResponse>(
      "/api/v1/auth/register/provider",
      data
    );
    return response.data;
  },

  login: async (credentials: LoginPayload) => {
    const response = await api.post<AuthResponse>("/api/v1/auth/login", credentials);
    return response.data;
  },
};
