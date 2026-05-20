import axios from "axios";
import { Platform } from "react-native";

// Expo uses EXPO_PUBLIC_ prefix for environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  android: "http://10.0.2.2:4000",
  default: "http://localhost:4000",
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
