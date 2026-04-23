import { Send } from "lucide-react";
import { useRef, useState } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    setSending(true);
    onSend();
    setTimeout(() => setSending(false), 600);
  };

  const hasText = value.trim().length > 0;

  return (
    <footer
      className="rounded-b-[20px]"
      style={{
        padding: "12px 16px",
        background: "rgba(0,0,0,0.2)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-2">
        {/* Input */}
        <div
          className="flex-1 transition-all duration-200"
          style={{
            borderRadius: "14px",
            background: "rgba(255,255,255,0.05)",
            border: focused
              ? "1px solid rgba(139,92,246,0.5)"
              : "1px solid rgba(255,255,255,0.1)",
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.1)" : "none",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask about AI fairness..."
            disabled={disabled}
            className="w-full bg-transparent text-sm outline-none"
            style={{
              padding: "10px 16px",
              color: "white",
              borderRadius: "14px",
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !hasText}
          className="flex h-10 w-10 shrink-0 items-center justify-center transition-all duration-200"
          style={{
            borderRadius: "12px",
            background: hasText && !disabled
              ? "linear-gradient(135deg, #8B5CF6, #6366F1)"
              : "rgba(255,255,255,0.05)",
            opacity: !hasText || disabled ? 0.4 : 1,
            cursor: !hasText || disabled ? "not-allowed" : "pointer",
            transform: sending ? "scale(0.95)" : "scale(1)",
          }}
          aria-label="Send message"
        >
          <Send
            className="h-[18px] w-[18px] text-white transition-transform duration-300"
            style={{ transform: sending ? "rotate(45deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>
    </footer>
  );
}
