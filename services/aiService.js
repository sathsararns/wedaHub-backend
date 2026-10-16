import axios from "axios";
import "dotenv/config";
import { setTimeout as delay } from "node:timers/promises";

function serviceError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

export function createAIClient({
  baseURL = process.env.AI_SERVICE_URL || "http://localhost:8000",
  readinessTimeoutMs = 90_000,
  requestTimeoutMs = 120_000,
  retryDelayMs = 1_000,
} = {}) {
  const url = baseURL.trim().replace(/\/+$/, "");

  async function waitUntilReady() {
    const deadline = Date.now() + readinessTimeoutMs;

    // A free Render instance may be asleep. Only retry this read-only probe;
    // replaying a chat POST could create a duplicate booking.
    while (Date.now() < deadline) {
      try {
        const response = await axios.get(`${url}/health`, {
          timeout: Math.min(10_000, Math.max(1, deadline - Date.now())),
        });
        if (response.data?.status === "ok") return;
      } catch (error) {
        const status = error.response?.status;
        if (status && ![502, 503, 504].includes(status)) break;
      }

      await delay(Math.min(retryDelayMs, Math.max(0, deadline - Date.now())));
    }

    throw serviceError(
      "The AI assistant is temporarily unavailable. Please try again shortly.",
      503,
      "AI_UNAVAILABLE"
    );
  }

  async function request(path, payload, streaming = false) {
    await waitUntilReady();

    try {
      const { data } = await axios.post(`${url}${path}`, payload, {
        timeout: requestTimeoutMs,
        ...(streaming ? { responseType: "stream" } : {}),
      });
      return data;
    } catch (error) {
      error.response?.data?.destroy?.();
      console.error("AI service request failed:", {
        path,
        status: error.response?.status,
        code: error.code,
      });
      const timedOut = ["ECONNABORTED", "ETIMEDOUT"].includes(error.code);
      throw serviceError(
        timedOut
          ? "The AI assistant took too long to respond. Please try again shortly."
          : "The AI assistant is temporarily unavailable. Please try again shortly.",
        timedOut ? 504 : 503,
        timedOut ? "AI_TIMEOUT" : "AI_UNAVAILABLE"
      );
    }
  }

  return {
    chatWithAI: (message, customerId = null) =>
      request("/chat", { message, customer_id: customerId }),
    streamChat: (message, customerId = null) =>
      request("/chat/stream", { message, customer_id: customerId }, true),
    resetChatMemory: (customerId = null, sessionId = null) =>
      request("/chat/reset", { customer_id: customerId, session_id: sessionId }),
  };
}

const aiClient = createAIClient();

// =============================
// Chat
// =============================

export async function chatWithAI(
  message,
  customerId = null
) {
  return aiClient.chatWithAI(message, customerId);
}

// =============================
// Chat (streaming)
// =============================
// Bridges to the AI service's POST /chat/stream and hands back the raw
// Node stream so the controller can pipe it straight through to the
// client without buffering the whole response first.

export async function streamChat(
  message,
  customerId = null
) {
  return aiClient.streamChat(message, customerId);
}

// =============================
// Chat Reset
// =============================
// Bridges to the AI service's POST /chat/reset, which clears that
// session's in-memory conversation state (app/memory/conversation_memory.py).

export async function resetChatMemory(
  customerId = null,
  sessionId = null
) {
  return aiClient.resetChatMemory(customerId, sessionId);
}
