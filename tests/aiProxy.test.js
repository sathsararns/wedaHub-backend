import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";

let aiServer;
let proxyServer;
let baseURL;
let behavior;
const previousURL = process.env.AI_SERVICE_URL;

before(async () => {
  aiServer = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.setHeader("Content-Type", "application/json");
      res.end('{"status":"ok"}');
      return;
    }
    // Read the entire incoming body before sending a delayed stream.
    req.resume();
    req.on("end", () => behavior(res));
  });
  await new Promise((resolve) => aiServer.listen(0, "127.0.0.1", resolve));
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${aiServer.address().port}`;
  const { createApp } = await import("../app.js");
  proxyServer = http.createServer(createApp({ database: { readyState: 1 } }));
  await new Promise((resolve) => proxyServer.listen(0, "127.0.0.1", resolve));
  baseURL = `http://127.0.0.1:${proxyServer.address().port}`;
});

after(async () => {
  if (previousURL === undefined) delete process.env.AI_SERVICE_URL;
  else process.env.AI_SERVICE_URL = previousURL;
  for (const server of [proxyServer, aiServer]) {
    if (!server) continue;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

function send() {
  return fetch(`${baseURL}/api/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "hi" }),
    signal: AbortSignal.timeout(3000),
  });
}

test("continues streaming a delayed reply after the browser request body is complete", async () => {
  behavior = (res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.write(": connected\n\n");
    setTimeout(() => {
      res.write('data: {"type":"chunk","text":"Hello"}\n\n');
      res.end('data: {"type":"done","booking":null}\n\n');
    }, 20);
  };
  const response = await send();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-accel-buffering"), "no");
  const text = await response.text();
  assert.match(text, /Hello/);
  assert.match(text, /"type":"done"/);
});

test("an upstream failure before streaming returns a readable service error", async (t) => {
  t.mock.method(console, "error", () => {});
  behavior = (res) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end('{"detail":"private upstream error"}');
  };
  const response = await send();
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "AI_UNAVAILABLE");
  assert.match(body.message, /temporarily unavailable/);
  assert.doesNotMatch(body.message, /private upstream error/);
});

test("an upstream disconnect after headers produces an error event", async (t) => {
  t.mock.method(console, "error", () => {});
  behavior = (res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.write(": connected\n\n");
    setTimeout(() => res.destroy(), 20);
  };
  const response = await send();
  const text = await response.text();
  assert.match(text, /"type":"error"/);
  assert.doesNotMatch(text, /"type":"done"/);
});
