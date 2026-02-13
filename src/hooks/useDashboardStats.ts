import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, fetchRecentActivity } from "@/services/dashboard";

const DASHBOARD_KEY = ["dashboard", "stats"];

export const useDashboardStats = () => {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: fetchDashboardStats,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
};

export const useDashboardRealtime = () => {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: fetchDashboardStats,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
};

export const useRecentActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: ["dashboard", "recent-activity", limit],
    queryFn: () => fetchRecentActivity(limit),
    refetchInterval: 5 * 60 * 1000,
  });
};
