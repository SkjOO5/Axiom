import { Bot, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

type ChatMessageProps = {
  message: ChatMessageType;
  onRetry?: (content: string) => void;
};

export default function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  if (!isAssistant) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[86%] rounded-2xl rounded-tr-md px-3 py-2 text-sm leading-relaxed text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[92%] items-start gap-2">
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="rounded-2xl rounded-tl-md border border-border bg-muted/65 px-3 py-2 text-sm leading-relaxed text-foreground">
          <div className="chat-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
          {message.status === "error" && message.retryContent && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(message.retryContent as string)}
              className="mt-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
