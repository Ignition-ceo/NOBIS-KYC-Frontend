import { api } from "@/lib/api";
import { ApplicantParams } from "@/types/applicant";

export const fetchApplicants = async (params?: ApplicantParams) => {
  try {
    const response = await api.get("/applicants", { params });
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const getApplicantDetails = async (applicantId: string) => {
  try {
    const response = await api.get(`/applicants/${applicantId}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const createApplicantService = async (applicantBody: Record<string, unknown>) => {
  if (!applicantBody) {
    return Promise.reject(new Error("Applicant data required"));
  }
  try {
    const response = await api.post("/applicants", applicantBody);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const updateApplicantService = async (applicantId: string, updateData: Record<string, unknown>) => {
  if (!applicantId) {
    return Promise.reject(new Error("Applicant ID required"));
  }
  try {
    const response = await api.patch(`/applicants/${applicantId}`, updateData);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const deleteApplicantService = async (applicantId: string) => {
  if (!applicantId) {
    return Promise.reject(new Error("Applicant ID required"));
  }
  try {
    const response = await api.delete(`/applicants/${applicantId}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const createOrUpdateVerificationResult = async (verificationResultData: Record<string, unknown>) => {
  const { data } = await api.post("/verification-results", verificationResultData);
  return data;
};
