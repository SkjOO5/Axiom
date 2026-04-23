import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles, Trash2, X } from "lucide-react";
import ChatInput from "@/components/chatbot/ChatInput";
import ChatMessage from "@/components/chatbot/ChatMessage";
import QuickActions from "@/components/chatbot/QuickActions";
import WelcomeMessage from "@/components/chatbot/WelcomeMessage";
import TypingIndicator from "@/components/chatbot/TypingIndicator";
import { sendChatMessage } from "@/services/chatService";
import type { AnalysisContext, ChatMessage as ChatMessageType, ConversationTurn } from "@/types/chat";

const CHAT_HISTORY_KEY = "axiom_chat_history";
const CHAT_OPENED_KEY = "axiom_chat_opened";

const QUICK_ACTIONS = [
  "What is AI bias?",
  "Explain my results",
  "How to use AXiOM?",
  "What's the EEOC 4/5 rule?",
];

function makeMessage(role: "user" | "assistant", content: string): ChatMessageType {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
    status: "ok",
  };
}

function readStoredMessages(): ChatMessageType[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    return parsed.slice(-50);
  } catch {
    return [];
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
  const [messages, setMessages] = useState<ChatMessageType[]>(() => readStoredMessages());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSentFirstUserMessage, setHasSentFirstUserMessage] = useState(
    () => readStoredMessages().some((m) => m.role === "user"),
  );
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const opened = localStorage.getItem(CHAT_OPENED_KEY) === "1";
    setHasOpenedBefore(opened);
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-50)));
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const distFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    if (distFromBottom < 80 || isLoading) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const distFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  };

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

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
  };

  const clearChat = () => {
    setMessages([]);
    setHasSentFirstUserMessage(false);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify([]));
  };

  const toggleChat = () => {
    if (isOpen) { setIsOpen(false); return; }
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
        : "Cannot connect to the server. Please ensure the backend is running. 🔄";
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

  const scrollToBottom = () => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  };

  const showWelcome = !hasSentFirstUserMessage && messages.length === 0;

  return (
    <>
      {/* ─── FLOATING ORB BUTTON ─────────────────────── */}
      <motion.button
        type="button"
        id="chatbot-bubble-btn"
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full outline-none flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 0 20px rgba(139,92,246,0.3), 0 8px 32px rgba(0,0,0,0.4)",
          backdropFilter: "blur(10px)",
        }}
        whileHover={{
          scale: 1.08,
          boxShadow: "0 0 30px rgba(139,92,246,0.5), 0 10px 40px rgba(0,0,0,0.5)",
        }}
        whileTap={{ scale: 0.95 }}
        animate={!hasOpenedBefore && !isOpen ? {
          scale: [1, 1.03, 1],
        } : undefined}
        transition={{ duration: 3, repeat: !hasOpenedBefore && !isOpen ? Infinity : 0, ease: "easeInOut" }}
        aria-label={isOpen ? "Close AXiOM AI chat" : "Open AXiOM AI chat"}
      >
        {/* Online dot */}
        <span
          className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0F0F19] bg-emerald-400"
          style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)" }}
        />

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <X className="h-6 w-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="sparkle"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ─── CHAT PANEL ──────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.section
            id="chatbot-panel"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{
              transformOrigin: "bottom right",
              background: "rgba(15,15,25,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px) saturate(180%)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.1)",
              borderRadius: "20px",
            }}
            className="fixed right-6 bottom-[88px] z-[9998] flex flex-col overflow-hidden w-[400px] h-[560px] max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:rounded-none"
            role="dialog"
            aria-label="AXiOM AI chatbot"
          >
            {/* ── HEADER ─────────────────────────────── */}
            <header
              className="flex items-center justify-between px-4 shrink-0"
              style={{
                height: "64px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px 20px 0 0",
              }}
            >
              {/* Left: Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)",
                      padding: "2px",
                    }}
                  >
                    <div
                      className="h-full w-full rounded-full flex items-center justify-center"
                      style={{ background: "rgba(15,15,25,0.9)" }}
                    >
                      <Sparkles className="h-4 w-4 text-purple-400" />
                    </div>
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                    style={{ background: "#34D399", borderColor: "#0F0F19", boxShadow: "0 0 6px rgba(52,211,153,0.7)" }}
                  />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white leading-tight">AXiOM AI</p>
                  <p className="text-[11px] leading-tight" style={{ color: "rgba(139,92,246,0.8)" }}>
                    AI Fairness Expert
                  </p>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(255,255,255,0.1)"; b.style.color = "white"; }}
                  onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "rgba(255,255,255,0.4)"; }}
                  onClick={clearChat}
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(255,255,255,0.1)"; b.style.color = "white"; }}
                  onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "rgba(255,255,255,0.4)"; }}
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat panel"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            </header>

            {/* ── MESSAGES AREA ──────────────────────── */}
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="axiom-chat-scroll flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            >
              {showWelcome && (
                <WelcomeMessage onAction={(text) => void send(text)} />
              )}

              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRetry={(value) => void send(value)}
                />
              ))}

              {isLoading && <TypingIndicator />}

              {showWelcome && (
                <div className="mt-2">
                  <QuickActions actions={QUICK_ACTIONS} onAction={(value) => void send(value)} />
                </div>
              )}

              {!hasSentFirstUserMessage && !showWelcome && (
                <QuickActions actions={QUICK_ACTIONS} onAction={(value) => void send(value)} />
              )}
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={scrollToBottom}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full z-10"
                  style={{
                    background: "rgba(139,92,246,0.15)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    backdropFilter: "blur(8px)",
                  }}
                  aria-label="Scroll to bottom"
                >
                  <ChevronDown className="h-4 w-4 text-purple-400" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── INPUT ──────────────────────────────── */}
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => void send(input)}
              disabled={isLoading}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── GLOBAL STYLES ─────────────────────────────── */}
      <style>{`
        .axiom-chat-scroll::-webkit-scrollbar { width: 4px; }
        .axiom-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .axiom-chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 999px; }
        .axiom-chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

        .bot-message strong { color: rgba(167,139,250,1); }
        .bot-message em { color: rgba(255,255,255,0.7); font-style: italic; }
        .bot-message ul, .bot-message ol { padding-left: 20px; margin: 8px 0; }
        .bot-message li { margin: 4px 0; color: rgba(255,255,255,0.85); }
        .bot-message li::marker { color: rgba(139,92,246,0.7); }
        .bot-message code {
          background: rgba(139,92,246,0.15);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          color: rgba(167,139,250,1);
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .bot-message pre {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 12px;
          overflow-x: auto;
          margin: 8px 0;
        }
        .bot-message pre code { background: transparent; padding: 0; }
        .bot-message a { color: rgba(139,92,246,0.9); text-decoration: underline; text-underline-offset: 2px; }
        .bot-message h1, .bot-message h2, .bot-message h3 { color: rgba(255,255,255,0.95); font-weight: 600; margin: 10px 0 6px; }
        .bot-message h1 { font-size: 1.1em; }
        .bot-message h2 { font-size: 1em; }
        .bot-message h3 { font-size: 0.95em; }
        .bot-message table { border-collapse: collapse; margin: 8px 0; width: 100%; }
        .bot-message th, .bot-message td { border: 1px solid rgba(255,255,255,0.1); padding: 6px 10px; font-size: 13px; }
        .bot-message th { background: rgba(139,92,246,0.1); color: rgba(167,139,250,1); }
        .bot-message p { margin: 4px 0; }
        .bot-message p:first-child { margin-top: 0; }
        .bot-message p:last-child { margin-bottom: 0; }
      `}</style>
    </>
  );
}
