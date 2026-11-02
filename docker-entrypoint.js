import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Docker local development needs a stable signing key across container rebuilds.
// Keep it out of the image, source tree, and logs.
if (!process.env.JWT_SECRET_KEY?.trim()) {
  const directory = "/app/runtime";
  const secretFile = `${directory}/jwt-secret`;
  mkdirSync(directory, { recursive: true });
  try {
    process.env.JWT_SECRET_KEY = readFileSync(secretFile, "utf8").trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const secret = randomBytes(48).toString("hex");
    writeFileSync(secretFile, secret, { mode: 0o600, flag: "wx" });
    process.env.JWT_SECRET_KEY = secret;
  }
}

await import("./index.js");
