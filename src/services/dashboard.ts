import { api } from "@/lib/api";

export const fetchDashboardStats = async () => {
  try {
    const response = await api.get("/applicants/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return Promise.reject(error);
  }
};

export const fetchDashboardStatsByDateRange = async (startDate: string, endDate: string) => {
  try {
    const response = await api.get("/applicants/stats", {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats by date range:", error);
    return Promise.reject(error);
  }
};

export const fetchRecentActivity = async (limit: number = 10) => {
  try {
    const response = await api.get("/applicants/recent-activity", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return Promise.reject(error);
  }
};
