import axios from "axios";
import { supabase } from "./supabase";

const BASE = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

// Automatically attach Supabase token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return config;
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
