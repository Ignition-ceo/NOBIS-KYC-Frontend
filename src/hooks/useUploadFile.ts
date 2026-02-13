import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { uploadFileToS3 } from "@/services/upload";

export const useUploadFile = (options: UseMutationOptions<unknown, unknown, { file: File }> = {}) => {
  return useMutation({
    mutationFn: uploadFileToS3,
    ...options,
  });
};
