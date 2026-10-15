import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import http from "node:http";
import { createApp } from "../app.js";
import { initSocket } from "../socket.js";
import { validateEnvironment } from "../config.js";

const database = { readyState: 1 };
const frontend = "https://wedahub.vercel.app";
let baseURL;
let io;
const previousOrigin = process.env.FRONTEND_URL;

before(async () => {
  process.env.FRONTEND_URL = `${frontend}, https://preview.example.com/`;
  const server = http.createServer(createApp({ database }));
  io = initSocket(server);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (previousOrigin === undefined) delete process.env.FRONTEND_URL;
  else process.env.FRONTEND_URL = previousOrigin;
  if (io) await new Promise((resolve) => io.close(resolve));
});

test("health reports database readiness without exposing configuration", async () => {
  let response = await fetch(`${baseURL}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", database: "connected" });
  database.readyState = 0;
  try {
    response = await fetch(`${baseURL}/health`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: "unavailable", database: "disconnected" });
  } finally {
    database.readyState = 1;
  }
});

test("REST and Socket.IO preflights allow configured origins and reject other origins", async () => {
  for (const path of ["/api/users/profile", "/socket.io/?EIO=4&transport=polling"]) {
    for (const origin of [frontend, "https://preview.example.com", "https://untrusted.example.com"]) {
      const response = await fetch(`${baseURL}${path}`, {
        method: "OPTIONS",
        headers: { Origin: origin, "Access-Control-Request-Method": "GET" },
      });
      const allowed = origin !== "https://untrusted.example.com";
      assert.equal(response.headers.get("access-control-allow-origin"), allowed ? origin : null);
      if (allowed) assert.equal(response.headers.get("access-control-allow-credentials"), "true");
    }
  }
});

test("production startup requires the frontend and AI deployment URLs", () => {
  const env = { NODE_ENV: "production", MONGO_URI: "mongodb://test", JWT_SECRET_KEY: "test-secret" };
  assert.throws(() => validateEnvironment(env), /FRONTEND_URL, AI_SERVICE_URL/);
  assert.doesNotThrow(() => validateEnvironment({
    ...env, FRONTEND_URL: frontend, AI_SERVICE_URL: "https://ai.example.com",
  }));
});
