import { Send } from "lucide-react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  return (
    <footer className="border-t border-border bg-card px-3 py-3">
      <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-2 py-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask about AI fairness..."
          className="w-full bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || value.trim().length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "var(--gradient-primary)" }}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
}
