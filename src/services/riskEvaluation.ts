// src/services/riskEvaluation.ts
import { api } from "@/lib/api";

export interface RiskQueueItem {
  _id: string;
  applicantId: string;
  fullName: string;
  email: string;
  applicantIdRemote: string;
  selfieUrl: string | null;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedAction: "APPROVE" | "REVIEW" | "REJECT";
  flags: string[];
  flagsCount: number;
  status: "PENDING" | "REVIEWED" | "ESCALATED";
  assessedAt: string;
  rawResponse: Record<string, any>;
}

export interface RiskQueueResponse {
  data: RiskQueueItem[];
  total: number;
  stats: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const fetchRiskEvaluations = async (params?: {
  search?: string;
  riskLevel?: string;
  page?: number;
  limit?: number;
}): Promise<RiskQueueResponse> => {
  const { data } = await api.get("/verification-results/risk-evaluations", {
    params,
  });
  return data;
};

export const getRiskEvaluationForApplicant = async (
  applicantId: string
): Promise<any> => {
  const { data } = await api.get(
    `/verification-results/by-type/${applicantId}/riskEvaluation`
  );
  return data;
};

export const updateRiskReviewStatus = async (
  id: string,
  status: string
): Promise<any> => {
  const { data } = await api.patch(
    `/verification-results/risk-evaluations/${id}/status`,
    { status }
  );
  return data;
};
