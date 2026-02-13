import { api } from "@/lib/api";

interface UploadParams {
  file: File;
}

/**
 * Uploads a file to S3 through backend API.
 * @returns S3UploadResult with { key, url, bucket }
 */
export const uploadFileToS3 = async ({ file }: UploadParams) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return Promise.reject(
      axiosError.response?.data?.message || "File upload failed"
    );
  }
};
