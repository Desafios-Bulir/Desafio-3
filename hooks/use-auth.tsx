import React, { createContext, useContext, useState } from "react";
import { authService, AuthResponse, LoginPayload, RegisterPayload } from "@/services/auth.service";
import { setApiToken } from "@/services/api";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "CLIENT" | "PROVIDER";
  balance: number;
  nif: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<User>;
  register: (data: RegisterPayload, role: "CLIENT" | "PROVIDER") => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setToken(response.access_token);
      setApiToken(response.access_token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: RegisterPayload, role: "CLIENT" | "PROVIDER") => {
    setIsLoading(true);
    try {
      let response: AuthResponse;
      if (role === "CLIENT") {
        const { nif, ...clientData } = formData;
        response = await authService.registerClient(clientData);
      } else {
        response = await authService.registerProvider(formData);
      }
      setUser(response.user);
      setToken(response.access_token);
      setApiToken(response.access_token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setApiToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
