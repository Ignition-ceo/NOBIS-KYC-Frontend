import { api } from "@/lib/api";

export const createFlowService = async (flowBody: Record<string, unknown>) => {
  if (!flowBody) {
    return Promise.reject(new Error("Flow data is required"));
  }
  try {
    const response = await api.post("/flows", flowBody);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const fetchClientFlows = async (page: number = 1, searchText: string = "") => {
  const limit = 10;
  try {
    const response = await api.get("/flows", {
      params: { page, limit, searchText },
    });
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const getFlowByIdService = async (flowId: string) => {
  if (!flowId) {
    return Promise.reject(new Error("Flow ID is required"));
  }
  try {
    const response = await api.get(`/flows/${flowId}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const updateFlowService = async (updateData: { id: string; [key: string]: unknown }) => {
  const { id: flowId, ...restData } = updateData;
  if (!flowId) {
    return Promise.reject(new Error("Flow ID is required"));
  }
  try {
    const response = await api.patch(`/flows/${flowId}`, restData);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const deleteFlowService = async (flowId: string) => {
  if (!flowId) {
    return Promise.reject(new Error("Flow ID is required"));
  }
  try {
    await api.delete(`/flows/${flowId}`);
    return true;
  } catch (error) {
    return Promise.reject(error);
  }
};
