import axios from "axios";

import { API_BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/store/authStore";

/** Configured Axios instance for all backend API calls. Not yet wired into any page. */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
