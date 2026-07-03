import httpClient from "@/configurations/httpClient";
import type { MediaFile } from "@/types/media.types";
import { handleApiResponse, type ApiResponse } from "@/utils/apiResponse";

// Get all media files
export const getAllMediaFiles = async (): Promise<MediaFile[]> => {
  return handleApiResponse<MediaFile[]>(
    httpClient.get<ApiResponse<MediaFile[]>>("/media")
  );
};

// Get media file by ID
export const getMediaFileById = async (fileId: string): Promise<MediaFile> => {
  return handleApiResponse<MediaFile>(
    httpClient.get<ApiResponse<MediaFile>>(`/media/${fileId}`)
  );
};

// Upload media file
export const uploadMediaFile = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  return handleApiResponse<{ url: string }>(
    httpClient.post<ApiResponse<{ url: string }>>("/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};

// Delete media file
export const deleteMediaFile = async (fileId: string): Promise<void> => {
  return handleApiResponse<void>(
    httpClient.delete<ApiResponse<void>>(`/media/${fileId}`)
  );
}

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

// Helper to get file extension from name or contentType
export const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toLowerCase() || "";
};

// Helper to check if file is image
export const isImageFile = (contentType: string): boolean => {
  return contentType.startsWith("image/");
};

// Helper to check if file is video
export const isVideoFile = (contentType: string): boolean => {
  return contentType.startsWith("video/");
};
