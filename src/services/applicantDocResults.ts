import { api } from "@/lib/api";

export const getApplicantFullDetails = async (applicantId: string) => {
  try {
    const response = await api.get(`/applicants/withAllDetails/${applicantId}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
