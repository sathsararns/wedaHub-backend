import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import http from "http";
import { initSocket } from "./socket.js";

// Routers
import userRouter from "./routers/userRouter.js";
import bookingRouter from "./routers/bookingRouter.js";
import adminRouter from "./routers/adminRouter.js";
import reviewRoutes from "./routers/reviewRoutes.js";
import contactRoutes from "./routers/contactRoutes.js";
import providerRouter from "./routers/providerRouter.js";
import aiRouter from "./routers/aiRouter.js";

// Middleware
import authenticate from "./middlewares/authenticate.js";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// DEBUG
app.use((req, res, next) => {
  console.log("=================================");
  console.log(req.method, req.url);
  console.log("Content-Type:", req.headers["content-type"]);
  next();
});

app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/providers", providerRouter);
app.use("/api/ai", aiRouter);
app.use("/api/bookings", bookingRouter);

app.use("/api/admin", authenticate, adminRouter);
app.use("/api/contact", authenticate, contactRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(console.error);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});