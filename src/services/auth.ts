import { api } from "@/lib/api";
import { LOCAL_STORAGE } from "@/lib/constants";

interface LoginCredentials {
  email: string;
  password: string;
}

export const loginAdmin = async (values: LoginCredentials) => {
  const { email, password } = values;
  const { data } = await api.post("/auth/login/admin", { email, password });
  return data;
};

export const loginClient = async (values: LoginCredentials) => {
  const { email, password } = values;
  const { data } = await api.post("/auth/login/client", { email, password });
  return data;
};

export const getClientProfile = async () => {
  const { data } = await api.get("/clients/profile");
  return data;
};

export const getAdminProfile = async () => {
  const { data } = await api.get("/admin/profile");
  return data;
};

export const logoutUser = async () => {
  try {
    // Log logout event before clearing session
    await api.post("/audit/log", {
      action: "client_logout",
      metadata: { source: "dashboard", timestamp: new Date().toISOString() },
    });
  } catch {
    // Don't block logout if audit fails
  }
  localStorage.removeItem(LOCAL_STORAGE.TOKEN_KEY);
  localStorage.removeItem(LOCAL_STORAGE.ROLE);
  window.location.href = "/login";
};

export const isAuthenticated = () => {
  return (
    !!localStorage.getItem(LOCAL_STORAGE.TOKEN_KEY) &&
    !!localStorage.getItem(LOCAL_STORAGE.ROLE)
  );
};
