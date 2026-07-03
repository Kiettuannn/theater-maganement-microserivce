import { useState, useMemo } from "react";
import type { ChatbotDocument } from "@/services/chatbotConfigService";

export function useChatbotFilters(documents: ChatbotDocument[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        doc.file?.originalFileName
          ?.toLowerCase()
          ?.includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === "all" || doc.documentType === filterType;
      const matchStatus =
        filterStatus === "all" || doc.documentStatus === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [documents, searchQuery, filterType, filterStatus]);

  return {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredDocuments,
  };
}
