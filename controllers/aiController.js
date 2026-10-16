import {
  chatWithAI,
  streamChat,
  resetChatMemory,
} from "../services/aiService.js";

// =========================
// Chat
// =========================

export const chat = async (req, res) => {
  try {
    const { message, customer_id, customerId } = req.body;

    const customer = customer_id || customerId || null;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const result = await chatWithAI(message, customer);

    return res.json(result);
  } catch (err) {
    console.error("AI CHAT ERROR:", err.message);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || "AI_ERROR",
    });
  }
};

// =========================
// Chat (streaming)
// =========================
// Pipes the AI service's SSE stream straight through to the client —
// no buffering, no re-encoding, so the browser sees the same chunks the
// AI service wrote as soon as they arrive.

export const chatStream = async (req, res) => {
  try {
    const { message, customer_id, customerId } = req.body;

    const customer = customer_id || customerId || null;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const upstream = await streamChat(message, customer);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    upstream.on("error", (err) => {
      console.error("AI STREAM UPSTREAM ERROR:", err.message);
      if (!res.destroyed && !res.writableEnded) {
        res.end(`data: ${JSON.stringify({
          type: "error",
          message: "The AI connection was interrupted. Please try again shortly.",
        })}\n\n`);
      }
    });

    // The request body can finish while the response is still streaming.
    // Tear down the upstream only when the response connection closes.
    res.on("close", () => {
      upstream.destroy();
    });

    upstream.pipe(res);
  } catch (err) {
    console.error("AI CHAT STREAM ERROR:", err.message);

    if (!res.headersSent) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        code: err.code || "AI_ERROR",
      });
    } else {
      res.end();
    }
  }
};

// =========================
// Chat Reset
// =========================

export const resetChat = async (req, res) => {
  try {
    const { customer_id, customerId, session_id, sessionId } = req.body;

    const customer = customer_id || customerId || null;
    const session = session_id || sessionId || null;

    const result = await resetChatMemory(customer, session);

    return res.json(result);
  } catch (err) {
    console.error("AI CHAT RESET ERROR:", err.message);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || "AI_ERROR",
    });
  }
};
