import { useState, useCallback, useRef } from "react";
import { chatService } from "@/services/chatService";
import { useConfirmDialog } from "./useConfirmDialog";

import type { SourceInfo } from "@/services/chatService";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  sources?: SourceInfo[];
}

const WELCOME_MESSAGE: Message = {
  id: "1",
  text: "Xin chào! Tôi có thể giúp gì cho bạn?",
  sender: "bot",
  timestamp: new Date(),
};

export function useChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { confirmDialog, closeConfirmDialog } =
    useConfirmDialog();

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    try {
      const history = await chatService.getChatHistory();

      if (history.length === 0) {
        setMessages([WELCOME_MESSAGE]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      setMessages([WELCOME_MESSAGE]);
    }
  }, []);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({
        query: currentQuery,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        sender: "bot",
        timestamp: new Date(),
        sources: response.sources || [],
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isLoading) {
        handleSendMessage();
      }
    },
    [isLoading, handleSendMessage]
  );

  // Clear chat history with confirmation
  const handleClearChat = async () => {
    await chatService.clearHistory();
    setMessages([WELCOME_MESSAGE]);
  }
   
  // Toggle chat window
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    // State
    isOpen,
    isLoading,
    messages,
    inputValue,
    messagesEndRef,
    confirmDialog,

    // Actions
    setInputValue,
    handleSendMessage,
    handleKeyPress,
    handleClearChat,
    toggleChat,
    loadChatHistory,
    scrollToBottom,
    closeConfirmDialog,
  };
}
