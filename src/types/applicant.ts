// src/types/applicant.ts
// Shared type definitions for applicant data

export type ApplicantStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";

export interface Applicant {
  _id?: string;
  id: string;
  clientId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone: string;
  address?: string;
  status: ApplicantStatus;
  level?: number;
  createdAt: string;
  updatedAt: string;
  selfieUrl?: string;
  flowId?: string;
  flowName?: string;
  idDocName?: string;
  utilityBillName?: string;
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  verificationResults?: Record<string, unknown>;
}

export interface ApplicantListResponse {
  applicants: Applicant[];
  totalPages: number;
  currentPage: number;
  totalApplicants: number;
}

export interface ApplicantParams {
  page?: number;
  limit?: number;
  searchText?: string;
  status?: string;
}

export interface DashboardStats {
  totalApplicants: number;
  approved: number;
  pending: number;
  rejected: number;
  transactionsUsed?: number;
  transactionsLimit?: number;
}

export interface RecentActivityItem {
  id: string;
  name: string;
  date: string;
  status: string;
}

export const VerificationType = {
  EMAIL: "email",
  PHONE: "phone",
  FACE: "selfie",
  ID: "idDocument",
  POA: "proofOfAddress",
  CLIENT_NOTES: "clientNotes",
} as const;

export type VerificationTypeKey = keyof typeof VerificationType;
