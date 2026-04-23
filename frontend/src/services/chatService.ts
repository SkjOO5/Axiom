import type { ChatApiRequest, ChatApiResponse } from "@/types/chat";
import { apiUrl } from "@/services/api";

export async function sendChatMessage(payload: ChatApiRequest): Promise<ChatApiResponse> {
  const normalizedPayload: ChatApiRequest = {
    ...payload,
    analysisContext: payload.analysisContext ?? { hasActiveAnalysis: false },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(apiUrl('/api/chat'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedPayload),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        typeof data?.detail === "string"
          ? data.detail
          : typeof data?.error === "string"
            ? data.error
            : "I'm having trouble connecting right now. Please try again in a moment.";
      throw new Error(message);
    }

    const text =
      typeof data?.response === "string"
        ? data.response
        : typeof data?.reply === "string"
          ? data.reply
          : "I'm having trouble connecting right now. Please try again in a moment. 🔄";

    return {
      response: text,
      timestamp: typeof data?.timestamp === "string" ? data.timestamp : new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 30 seconds. Please try again. 🔄");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
