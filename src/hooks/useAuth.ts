import { useMutation } from "@tanstack/react-query";
import { isAuthenticated, loginAdmin, loginClient, logoutUser } from "@/services/auth";

export const useAdminLogin = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) => loginAdmin(credentials),
  });
};

export const useClientLogin = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) => loginClient(credentials),
  });
};

export const useIsAuthenticated = () => {
  return { isAuthenticated: isAuthenticated() };
};

export const useLogout = () => {
  const logout = () => {
    logoutUser();
  };

  return { logout };
};
