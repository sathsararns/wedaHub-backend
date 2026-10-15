import axios from "axios";
import "dotenv/config";

const AI_BASE_URL =
  (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/+$/, "");

// =============================
// Chat
// =============================

export async function chatWithAI(
  message,
  customerId = null
) {
  try {
    const { data } = await axios.post(
      `${AI_BASE_URL}/chat`,
      {
        message,
        customer_id: customerId,
      }
    );

    return data;
  } catch (error) {
    console.error("AI Service:", error.message);

    throw new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        "Cannot connect to AI Service"
    );
  }
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
  const response = await axios.post(
    `${AI_BASE_URL}/chat/stream`,
    {
      message,
      customer_id: customerId,
    },
    {
      responseType: "stream",
    }
  );

  return response.data;
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
  try {
    const { data } = await axios.post(
      `${AI_BASE_URL}/chat/reset`,
      {
        customer_id: customerId,
        session_id: sessionId,
      }
    );

    return data;
  } catch (error) {
    console.error("AI Service:", error.message);

    throw new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        "Cannot reset AI chat memory"
    );
  }
}
