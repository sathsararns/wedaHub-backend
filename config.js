import "dotenv/config";

export function getCorsOptions(env = process.env) {
  const origins = (env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return { origin: origins, credentials: true };
}

export function validateEnvironment(env = process.env) {
  const required = ["MONGO_URI", "JWT_SECRET_KEY"];
  if (env.NODE_ENV === "production") {
    required.push("FRONTEND_URL", "AI_SERVICE_URL");
  }
  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}
