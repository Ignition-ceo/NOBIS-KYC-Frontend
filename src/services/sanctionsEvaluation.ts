// src/services/sanctionsEvaluation.ts
import { api } from "@/lib/api";

export interface AmlQueueItem {
  _id: string;
  applicantId: string;
  fullName: string;
  email: string;
  applicantIdRemote: string;
  selfieUrl: string | null;
  searchName: string;
  warningTypes: string[];
  matchStatus: "NO_MATCH" | "POTENTIAL_MATCH" | "TRUE_MATCH" | "FALSE_POSITIVE";
  riskLevel: "Low" | "Medium" | "High";
  status: "REVIEWED" | "PENDING" | "HIT" | "CLEAR";
  matchCount: number;
  assessedAt: string;
  rawResponse: Record<string, any>;
}

export interface AmlQueueResponse {
  data: AmlQueueItem[];
  total: number;
  stats: {
    total: number;
    pending: number;
    hits: number;
    clear: number;
  };
}

export const fetchSanctionsEvaluations = async (params?: {
  search?: string;
  status?: string;
  riskLevel?: string;
  page?: number;
  limit?: number;
}): Promise<AmlQueueResponse> => {
  const { data } = await api.get(
    "/verification-results/sanctions-evaluations",
    { params }
  );
  return data;
};

export const getSanctionsEvaluationForApplicant = async (
  applicantId: string
): Promise<any> => {
  const { data } = await api.get(
    `/verification-results/by-type/${applicantId}/sanctionEvaluation`
  );
  return data;
};

export const updateSanctionsReviewStatus = async (
  id: string,
  status: string
): Promise<any> => {
  const { data } = await api.patch(
    `/verification-results/sanctions-evaluations/${id}/status`,
    { status }
  );
  return data;
};
