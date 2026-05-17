import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

// Attach Clerk token to every request
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
