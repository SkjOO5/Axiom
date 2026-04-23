export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status?: "ok" | "error";
  retryContent?: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AnalysisContext {
  hasActiveAnalysis: boolean;
  fileType?: string;
  fileName?: string;
  fairnessScore?: number;
  riskLevel?: string;
  keyFindings?: string[];
  metrics?: Record<string, number | undefined>;
}

export interface ChatApiRequest {
  message: string;
  conversationHistory: ConversationTurn[];
  analysisContext: AnalysisContext | null;
}

export interface ChatApiResponse {
  response: string;
  timestamp: string;
}
