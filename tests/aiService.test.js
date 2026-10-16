import assert from "node:assert/strict";
import http from "node:http";
import { test } from "node:test";
import { createAIClient } from "../services/aiService.js";

async function service(t, handler, options = {}) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  }));
  return createAIClient({
    baseURL: `http://127.0.0.1:${server.address().port}/`,
    readinessTimeoutMs: 500,
    requestTimeoutMs: 500,
    retryDelayMs: 5,
    ...options,
  });
}

test("waits for a sleeping AI service, then sends the chat POST exactly once", async (t) => {
  let probes = 0;
  let posts = 0;
  const client = await service(t, (req, res) => {
    if (req.url === "/health") {
      probes++;
      res.writeHead(probes < 3 ? 503 : 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: probes < 3 ? "unavailable" : "ok" }));
      return;
    }
    assert.equal(req.url, "/chat/stream");
    assert.equal(req.method, "POST");
    posts++;
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      assert.deepEqual(JSON.parse(body), { message: "hi", customer_id: "customer-1" });
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.write('data: {"type":"chunk","text":"Hello"}\n\n');
      setImmediate(() => res.end('data: {"type":"done","booking":null}\n\n'));
    });
  });
  const stream = await client.streamChat("hi", "customer-1");
  let text = "";
  for await (const chunk of stream) text += chunk;
  assert.match(text, /Hello/);
  assert.match(text, /"type":"done"/);
  assert.equal(probes, 3);
  assert.equal(posts, 1);
});

test("an unavailable AI service returns a bounded 503 without submitting chat", async (t) => {
  let posts = 0;
  const client = await service(t, (req, res) => {
    if (req.method === "POST") posts++;
    res.writeHead(503);
    res.end("Starting");
  }, { readinessTimeoutMs: 40 });
  await assert.rejects(client.streamChat("confirm booking"), {
    statusCode: 503, code: "AI_UNAVAILABLE",
  });
  assert.equal(posts, 0);
});

test("does not retry a failed chat POST that may already have created a booking", async (t) => {
  t.mock.method(console, "error", () => {});
  let posts = 0;
  const client = await service(t, (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/health") return res.end('{"status":"ok"}');
    posts++;
    res.writeHead(500);
    res.end('{"detail":"private upstream diagnostics"}');
  });
  await assert.rejects(client.streamChat("confirm booking"), (error) => {
    assert.equal(error.statusCode, 503);
    assert.doesNotMatch(error.message, /private upstream diagnostics/);
    return true;
  });
  assert.equal(posts, 1);
});

test("a stalled chat request times out without replaying it", async (t) => {
  t.mock.method(console, "error", () => {});
  let posts = 0;
  const client = await service(t, (req, res) => {
    if (req.url === "/health") {
      res.setHeader("Content-Type", "application/json");
      res.end('{"status":"ok"}');
    } else {
      posts++;
      // Leave the connection open to simulate an upstream that never replies.
    }
  }, { requestTimeoutMs: 30 });
  await assert.rejects(client.streamChat("hi"), { statusCode: 504, code: "AI_TIMEOUT" });
  assert.equal(posts, 1);
});
