import { useEffect, useState } from "react";
import { MessageCircle, X, Send, Trash2, FileText } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatbot } from "@/hooks/useChatbot";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SourceInfo } from "@/services/chatService";

export const ChatbotWidget = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [hasModalOpen, setHasModalOpen] = useState(false);

  const {
    isOpen,
    isLoading,
    messages,
    inputValue,
    messagesEndRef,
    confirmDialog,
    setInputValue,
    handleSendMessage,
    handleKeyPress,
    handleClearChat,
    toggleChat,
    loadChatHistory,
    scrollToBottom,
    closeConfirmDialog,
  } = useChatbot();

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen, loadChatHistory]);

  // Detect when preview modal is open (backdrop exists)
  useEffect(() => {
    const checkModal = () => {
      const backdrop = document.querySelector(
        '.fixed.bg-black\\/50, [class*="backdrop"]'
      );
      setHasModalOpen(!!backdrop);
    };

    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Close chat with ESC key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        toggleChat();
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, toggleChat]);

  if (!isAuthenticated) {
    return null;
  }

  // Hide widget when modal is open
  if (hasModalOpen) {
    return null;
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText || "Confirm"}
        cancelText="Cancel"
        variant={confirmDialog.variant || "destructive"}
      />

      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        {/* Chat Window */}
        {isOpen && (
          <div className="mb-4 w-[calc(100vw-32px)] sm:w-[360px] h-[60vh] max-h-[500px] min-h-[300px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle size={24} />
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs text-blue-100">
                    Always ready to assist you!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="hover:bg-blue-400 rounded-full p-1.5 transition-colors cursor-pointer"
                  title="New Chat"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 size={20} />
                    <span>Clear</span>
                  </div>
                </button>
                <button
                  onClick={toggleChat}
                  className="hover:bg-blue-400 rounded-full p-1.5 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-800 shadow-sm border border-gray-200"
                    }`}
                  >
                    <div
                      className={`text-sm prose prose-sm max-w-none ${
                        message.sender === "user"
                          ? "prose-invert"
                          : "prose-slate"
                      }`}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="mb-2 ml-4 list-disc">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mb-2 ml-4 list-decimal">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="mb-1">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold">
                              {children}
                            </strong>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-400 pl-3 italic my-2">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>

                    {/* Display sources if available */}
                    {message.sender === "bot" &&
                      message.sources &&
                      message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <FileText size={12} />
                            <span className="font-semibold">Sources:</span>
                          </div>
                          <div className="space-y-1">
                            {message.sources.map(
                              (source: SourceInfo, index: number) => (
                                <div
                                  key={`${source.fileId}-${index}`}
                                  className="text-xs bg-gray-50 rounded p-2 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-blue-600 font-medium min-w-[20px]">
                                      [{index + 1}]
                                    </span>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-700">
                                        {source.fileName}
                                      </div>
                                      <div className="text-gray-500 mt-0.5">
                                        {source.documentType} • Priority:{" "}
                                        {source.priority}
                                      </div>
                                      {source.sectionTitles &&
                                        source.sectionTitles.length > 0 && (
                                          <div className="text-gray-600 mt-1 italic">
                                            {source.sectionTitles
                                              .slice(0, 2)
                                              .join(", ")}
                                            {source.sectionTitles.length > 2 &&
                                              "..."}
                                          </div>
                                        )}
                                      {source.filePath && (
                                        <a
                                          href={source.filePath}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                        >
                                          View document
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    <span
                      className={`text-xs mt-1 block ${
                        message.sender === "user"
                          ? "text-blue-50"
                          : "text-gray-400"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-lg p-3 bg-white shadow-sm border border-gray-200">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Input message..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={toggleChat}
          className={`${
            isOpen ? "hidden" : "flex"
          } w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg items-center justify-center transition-all hover:scale-110`}
        >
          <MessageCircle size={24} />
        </button>
      </div>
    </>
  );
};
