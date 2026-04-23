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
      if (response.status === 404) throw new Error('Chat service not found. Please check if the server is running.');
      if (response.status === 500) throw new Error('Server error. Please try again.');
      if (response.status === 429) throw new Error('Too many requests. Please wait a moment.');
      throw new Error(data.detail || data.error || `Server error (${response.status})`);
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
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to the server. Please ensure the backend is running on port 8000.');
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 30 seconds. Please try again. 🔄");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
