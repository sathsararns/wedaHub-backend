import { validateEnvironment } from "./config.js";
import mongoose from "mongoose";
import dns from "node:dns";
import http from "http";
import { initSocket } from "./socket.js";
import { createApp } from "./app.js";

async function start() {
  validateEnvironment();

  // Use the host's DNS by default. Local networks can opt into a DNS override.
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(",").map((value) => value.trim()));
  }

  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  } catch {
    // Never print the URI: it includes the database username and password.
    throw new Error("MongoDB connection failed. Check MONGO_URI and Atlas network access.");
  }

  const server = http.createServer(createApp());
  initSocket(server);
  const port = process.env.PORT || 3000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`MongoDB connected. Server running on ${port}`);
  });
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
