import { handleApiResponse } from "@/utils/apiResponse";
import type { ApiResponse } from "@/utils/apiResponse";
import httpClient from "../configurations/httpClient";

export interface ChatRequest {
  query: string;
}

export interface SourceInfo {
  fileId: string;
  fileName: string;
  filePath: string;
  documentType: string;
  priority: number;
  chunkIndices: number[];
  sectionTitles: string[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceInfo[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  sources?: SourceInfo[];
}

export const chatService = {

  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    return handleApiResponse<ChatResponse>(
      httpClient.post<ApiResponse<ChatResponse>>("/chatbot/chat", request)
    );
  },

  clearHistory: async (): Promise<void> => {
    return handleApiResponse<void>(
      httpClient.delete<ApiResponse<void>>("/chatbot/history")
    );
  },

  getChatHistory: async (): Promise<ChatMessage[]> => {
    return handleApiResponse<ChatMessage[]>(
      httpClient.get<ApiResponse<ChatMessage[]>>("/chatbot/history")
    ).then(messages => 
      messages.map((msg, index) => ({
        ...msg,
        id: `history-${index}`,
        timestamp: new Date(msg.timestamp),
      }))
    );
  },
};
