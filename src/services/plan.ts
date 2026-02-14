import { api } from "@/lib/api";

export const fetchPlans = async () => {
  try {
    const response = await api.get("/plans");
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const fetchClientPlans = async () => {
  try {
    // Get client profile which includes subscriptionPlans
    const response = await api.get("/clients/profile");
    const client = response.data?.user || response.data;
    const planIds: string[] = client?.subscriptionPlans || [];

    // If plans are populated objects, return them directly
    if (planIds.length > 0 && typeof planIds[0] === "object") {
      return planIds;
    }

    // Otherwise fetch all plans and filter to client's plans
    const allPlans = await fetchPlans();
    const clientPlans = Array.isArray(allPlans)
      ? allPlans.filter((p: any) => planIds.includes(p._id))
      : [];

    return clientPlans;
  } catch (error) {
    return Promise.reject(error);
  }
};
