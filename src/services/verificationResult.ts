import { api } from "@/lib/api";

export const getVerificationResultByIdAndType = async (
  applicantId: string,
  verificationType: string
) => {
  const { data } = await api.get(
    `/verification-results/by-type/${applicantId}/${verificationType}`
  );
  return data;
};

export const getAllVerificationResults = async () => {
  const { data } = await api.get("/verification-results");
  return data;
};

export const getVerificationResultById = async (id: string) => {
  const { data } = await api.get(`/verification-results/${id}`);
  return data;
};

export const updateVerificationResultById = async (
  id: string,
  updateData: Record<string, unknown>
) => {
  const { data } = await api.patch(`/verification-results/${id}`, updateData);
  return data;
};

export const deleteVerificationResultById = async (id: string) => {
  const { data } = await api.delete(`/verification-results/${id}`);
  return data;
};
