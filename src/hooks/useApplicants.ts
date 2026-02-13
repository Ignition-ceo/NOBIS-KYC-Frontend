import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchApplicants,
  getApplicantDetails,
  createApplicantService,
  updateApplicantService,
  deleteApplicantService,
  createOrUpdateVerificationResult,
} from "@/services/applicant";
import { ApplicantParams } from "@/types/applicant";

const APPLICANTS_KEY = ["applicants"];

// Fetch list of applicants with filters/pagination
export const useApplicantsQuery = (params?: ApplicantParams) => {
  return useQuery({
    queryKey: [...APPLICANTS_KEY, params],
    queryFn: () => fetchApplicants(params),
  });
};

// Fetch single applicant details
export const useApplicantDetailsQuery = (applicantId?: string) => {
  return useQuery({
    queryKey: ["applicant", applicantId],
    queryFn: () => getApplicantDetails(applicantId!),
    enabled: !!applicantId,
  });
};

export const useCreateOrUpdateVerificationResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrUpdateVerificationResult,
    onSuccess: (_: unknown, variables: Record<string, unknown>) => {
      queryClient.invalidateQueries({
        queryKey: ["applicant", variables.applicantId],
      });
    },
  });
};

// Create new applicant mutation
export const useCreateApplicantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplicantService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICANTS_KEY });
    },
  });
};

// Update existing applicant mutation
export const useUpdateApplicantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicantId, updateData }: { applicantId: string; updateData: Record<string, unknown> }) =>
      updateApplicantService(applicantId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICANTS_KEY });
    },
  });
};

export const useDeleteApplicantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplicantService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICANTS_KEY });
    },
  });
};
