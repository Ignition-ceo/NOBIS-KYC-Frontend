import { api } from "@/lib/api";

export const updateClientProfile = async (dataObj: Record<string, unknown>) => {
  const { data } = await api.patch("/clients/profile", dataObj);
  return data;
};
