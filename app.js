import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { getCorsOptions } from "./config.js";
import userRouter from "./routers/userRouter.js";
import bookingRouter from "./routers/bookingRouter.js";
import adminRouter from "./routers/adminRouter.js";
import reviewRoutes from "./routers/reviewRoutes.js";
import contactRoutes from "./routers/contactRoutes.js";
import providerRouter from "./routers/providerRouter.js";
import aiRouter from "./routers/aiRouter.js";
import authenticate from "./middlewares/authenticate.js";

export function createApp({ database = mongoose.connection } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors(getCorsOptions()));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ message: "WedaHub API Running" });
  });

  // Render marks the deployment healthy only when MongoDB is connected.
  app.get("/health", (req, res) => {
    const connected = database.readyState === 1;
    res.status(connected ? 200 : 503).json({
      status: connected ? "ok" : "unavailable",
      database: connected ? "connected" : "disconnected",
    });
  });

  app.use("/api/users", userRouter);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/providers", providerRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/bookings", bookingRouter);
  app.use("/api/admin", authenticate, adminRouter);
  app.use("/api/contact", authenticate, contactRoutes);

  return app;
}
