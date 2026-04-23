import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Sparkles, Trash2, X } from "lucide-react";
import ChatInput from "@/components/chatbot/ChatInput";
import ChatMessage from "@/components/chatbot/ChatMessage";
import QuickActions from "@/components/chatbot/QuickActions";
import { sendChatMessage } from "@/services/chatService";
import type { AnalysisContext, ChatMessage as ChatMessageType, ConversationTurn } from "@/types/chat";

const CHAT_HISTORY_KEY = "axiom_chat_history";
const CHAT_OPENED_KEY = "axiom_chat_opened";

const QUICK_ACTIONS = [
  "What is AI bias?",
  "Explain my results",
  "How to use AXiOM?",
  "What metrics do you check?",
];

const WELCOME_TEXT = `👋 Hi! I'm AXiOM AI, your AI Fairness Expert.\n\nI can help you with:\n\n🔍 Understanding your analysis results — Ask me about your fairness scores and what they mean\n\n📊 Fairness metrics — I can explain any metric like Disparate Impact, Demographic Parity, Equalized Odds, etc.\n\n⚖️ Regulatory compliance — Ask about EEOC, EU AI Act, GDPR, and other regulations\n\n🛠️ Fixing bias — I'll suggest specific remediation strategies\n\n📋 Using AXiOM — I can guide you through uploading files and running analyses\n\nWhat would you like to know?`;

function makeMessage(role: "user" | "assistant", content: string): ChatMessageType {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
    status: "ok",
  };
}

function getDefaultMessages(): ChatMessageType[] {
  return [makeMessage("assistant", WELCOME_TEXT)];
}

function readStoredMessages(): ChatMessageType[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return getDefaultMessages();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return getDefaultMessages();
    return parsed.slice(-50);
  } catch {
    return getDefaultMessages();
  }
}

function getAnalysisContext(): AnalysisContext | null {
  try {
    const raw = localStorage.getItem("axiom_analysis_history");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const latest = parsed[0];
    const fullResults = latest?.fullResults || {};

    const keyFindings: string[] = [];
    const metrics: Record<string, number | undefined> = {
      demographicParity: undefined,
      disparateImpact: undefined,
      equalOpportunity: undefined,
      equalizedOdds: undefined,
    };

    if (fullResults?.audits && typeof fullResults.audits === "object") {
      const firstAuditKey = Object.keys(fullResults.audits)[0];
      const firstAudit = firstAuditKey ? fullResults.audits[firstAuditKey] : null;

      const findings = firstAudit?.executive_summary?.key_findings;
      if (Array.isArray(findings)) {
        findings.slice(0, 5).forEach((item: unknown) => {
          if (typeof item === "string") keyFindings.push(item);
        });
      }

      metrics.demographicParity = firstAudit?.demographic_parity ?? firstAudit?.demographicParity;
      metrics.disparateImpact = firstAudit?.disparate_impact ?? firstAudit?.disparateImpact;
      metrics.equalOpportunity = firstAudit?.equal_opportunity ?? firstAudit?.equalOpportunity;
      metrics.equalizedOdds = firstAudit?.equalized_odds ?? firstAudit?.equalizedOdds;
    }

    if (keyFindings.length === 0 && Array.isArray(fullResults?.findings)) {
      fullResults.findings.slice(0, 5).forEach((item: unknown) => {
        if (typeof item === "string") keyFindings.push(item);
        else if (typeof (item as { title?: unknown })?.title === "string") {
          keyFindings.push((item as { title: string }).title);
        }
      });
    }

    return {
      hasActiveAnalysis: true,
      fileType: typeof latest?.fileType === "string" ? latest.fileType.replace(/^\./, "") : undefined,
      fileName: latest?.fileName,
      fairnessScore: typeof latest?.overallFairnessScore === "number" ? latest.overallFairnessScore : undefined,
      riskLevel: typeof latest?.riskLevel === "string" ? latest.riskLevel : undefined,
      keyFindings,
      metrics,
    };
  } catch {
    return null;
  }
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);
  const [showResumeChoice, setShowResumeChoice] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>(() => readStoredMessages());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSentFirstUserMessage, setHasSentFirstUserMessage] = useState(
    () => readStoredMessages().some((m) => m.role === "user"),
  );

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const opened = localStorage.getItem(CHAT_OPENED_KEY) === "1";
    setHasOpenedBefore(opened);
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages, isLoading, isOpen]);

  const conversationHistory = useMemo<ConversationTurn[]>(() => {
    return messages
      .filter((m) => m.content.trim().length > 0)
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  const openChat = () => {
    setIsOpen(true);
    if (!hasOpenedBefore) {
      localStorage.setItem(CHAT_OPENED_KEY, "1");
      setHasOpenedBefore(true);
    }

    const hasHistory = messages.some((m) => m.role === "user");
    setShowResumeChoice(hasHistory);
  };

  const clearChat = () => {
    const fresh = getDefaultMessages();
    setMessages(fresh);
    setHasSentFirstUserMessage(false);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(fresh));
    setShowResumeChoice(false);
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    openChat();
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg = makeMessage("user", trimmed);
    const baseHistory = conversationHistory;

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setHasSentFirstUserMessage(true);
    setShowResumeChoice(false);

    try {
      const result = await sendChatMessage({
        message: trimmed,
        conversationHistory: baseHistory,
        analysisContext: getAnalysisContext(),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.response,
          timestamp: result.timestamp,
          status: "ok",
        },
      ]);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "I'm having trouble connecting right now. Please try again in a moment. 🔄";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: message,
          timestamp: new Date().toISOString(),
          status: "error",
          retryContent: trimmed,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full text-primary-foreground shadow-2xl outline-none"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "0 18px 45px hsl(263 70% 50% / 0.35)",
        }}
        whileHover={{ scale: 1.1, boxShadow: "0 22px 55px hsl(263 70% 50% / 0.45)" }}
        whileTap={{ scale: 0.96 }}
        animate={
          !hasOpenedBefore && !isOpen
            ? {
                scale: [1, 1.06, 1],
                boxShadow: [
                  "0 18px 45px hsl(263 70% 50% / 0.35)",
                  "0 24px 60px hsl(263 70% 50% / 0.48)",
                  "0 18px 45px hsl(263 70% 50% / 0.35)",
                ],
              }
            : undefined
        }
        transition={{ duration: 1.8, repeat: !hasOpenedBefore && !isOpen ? Infinity : 0, ease: "easeInOut" }}
        aria-label={isOpen ? "Close AXiOM AI chat" : "Open AXiOM AI chat"}
      >
        {isOpen ? <X className="mx-auto h-6 w-6" /> : <MessageCircle className="mx-auto h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-6 bottom-[88px] z-[9998] flex w-[380px] h-[520px] flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-2xl sm:rounded-2xl sm:w-[350px] sm:h-[480px] lg:w-[380px] lg:h-[520px] max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-16 max-sm:h-auto max-sm:w-full max-sm:rounded-none"
            role="dialog"
            aria-label="AXiOM AI chatbot"
          >
            <header
              className="flex items-center justify-between border-b border-border px-4 py-3"
              style={{ background: "linear-gradient(145deg, hsl(0 0% 10%), hsl(263 70% 12%))" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles className="h-4 w-4 text-white" />
                  <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border border-card bg-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AXiOM AI</p>
                  <p className="text-xs text-muted-foreground">AI Fairness Expert</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={clearChat}
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {showResumeChoice ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-foreground">Continue your previous conversation?</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      clearChat();
                    }}
                  >
                    Start New
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-xs text-white"
                    style={{ background: "var(--gradient-primary)" }}
                    onClick={() => setShowResumeChoice(false)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div ref={listRef} className="chat-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} onRetry={(value) => void send(value)} />
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2">
                        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="rounded-2xl rounded-tl-md border border-border bg-muted/65 px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasSentFirstUserMessage && (
                    <QuickActions actions={QUICK_ACTIONS} onAction={(value) => void send(value)} />
                  )}
                </div>

                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={() => void send(input)}
                  disabled={isLoading}
                />
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
