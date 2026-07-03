import httpClient from "@/configurations/httpClient";
import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";

const BASE_URL = "/chatbot/documents";

export interface ChatbotDocument {
  id: string;
  file: {
    id: string;
    originalFileName: string;
    url: string;
    contentType: string;
    size: number;
    uploadDate: string;
  };
  documentType: "POLICY" | "HANDBOOK" | "GUIDELINE" | "FAQ";
  documentStatus: "INACTIVE" | "ACTIVE" | "PROCESSING" | "FAILED";
  priority: number;
  description?: string;
  chunksCount?: number;
  syncedAt?: string;
  syncedBy?: string;
  syncError?: string;
  progressPercentage?: number;
  addedAt: string;
}

export interface AddDocumentRequest {
  fileId: string;
  documentType: "POLICY" | "HANDBOOK" | "GUIDELINE" | "FAQ";
  priority: number;
  description?: string;
  syncImmediately: boolean;
}

export interface HealthCheckResponse {
  databaseConnected: boolean;
  vectorStoreCount: number;
  aiModelResponding: boolean;
  activeDocuments: number;
  totalChunks: number;
}

export const chatbotConfigService = {
  /**
   * Get all documents
   */
  getAllDocuments: async (): Promise<ChatbotDocument[]> => {
    return handleApiResponse<ChatbotDocument[]>(
      httpClient.get<ApiResponse<ChatbotDocument[]>>(BASE_URL)
    );
  },

  /**
   * Get document by ID
   */
  getDocumentById: async (documentId: string): Promise<ChatbotDocument> => {
    return handleApiResponse<ChatbotDocument>(
      httpClient.get<ApiResponse<ChatbotDocument>>(`${BASE_URL}/${documentId}`)
    );
  },

  /**
   * Add new document
   */
  addDocument: async (
    request: AddDocumentRequest
  ): Promise<ChatbotDocument> => {
    return handleApiResponse<ChatbotDocument>(
      httpClient.post<ApiResponse<ChatbotDocument>>(BASE_URL, request)
    );
  },

  /**
   * Sync document to vector store
   */
  syncDocument: async (documentId: string): Promise<void> => {
    await httpClient.post(`${BASE_URL}/${documentId}/sync`);
  },

  /**
   * Re-sync document
   */
  resyncDocument: async (documentId: string): Promise<void> => {
    await httpClient.post(`${BASE_URL}/${documentId}/resync`);
  },

  /**
   * Toggle document status (Active/Inactive)
   */
  toggleDocumentStatus: async (documentId: string): Promise<void> => {
    await httpClient.post(`${BASE_URL}/${documentId}/toggle`);
  },

  /**
   * Delete document
   */
  deleteDocument: async (documentId: string): Promise<void> => {
    await httpClient.delete(`${BASE_URL}/${documentId}`);
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<HealthCheckResponse> => {
    return handleApiResponse<HealthCheckResponse>(
      httpClient.get<ApiResponse<HealthCheckResponse>>(
        `${BASE_URL}/health`
      )
    );
  },
};
