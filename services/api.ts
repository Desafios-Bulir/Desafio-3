import axios from "axios";
import { Platform } from "react-native";

const API_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  Platform.select({
    android: "https://desafio-1-dgfd.onrender.com",
    default: "https://desafio-1-dgfd.onrender.com",
  });

export const api = axios.create({
  baseURL: API_URL,
});

let authToken: string | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});
