import { RotateCcw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

type ChatMessageProps = {
  message: ChatMessageType;
  onRetry?: (content: string) => void;
};

function formatTime(isoStr: string) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Just now";
  }
}

export default function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const isError = message.status === "error";

  if (!isAssistant) {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, x: 8, y: 4 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex flex-col items-end gap-1 max-w-[80%]">
          <div
            className="rounded-2xl rounded-tr-[4px] px-4 py-3 text-sm leading-relaxed text-white"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(79,70,229,0.3))",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
          >
            {message.content}
          </div>
          <span className="text-[10px] pr-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, x: -8, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-start gap-2 max-w-[85%]">
        {/* Bot avatar */}
        <div
          className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
            boxShadow: "0 0 8px rgba(139,92,246,0.35)",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        </div>

        {/* Bubble */}
        <div className="flex flex-col gap-1">
          <div
            className="rounded-[4px_16px_16px_16px] px-4 py-3 text-sm leading-relaxed bot-message"
            style={{
              background: isError ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.05)",
              border: isError ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {isError && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <span className="text-xs text-red-400/90 font-medium">Error</span>
              </div>
            )}
            <div className="chat-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
            {isError && message.retryContent && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.retryContent as string)}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.6)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
              >
                <RotateCcw className="h-3 w-3" />
                Try again
              </button>
            )}
          </div>
          <span className="text-[10px] pl-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
