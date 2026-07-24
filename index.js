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

// Middleware
import authenticate from "./middlewares/authenticate.js";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const server = http.createServer(app);

/* ============================
   SOCKET.IO
============================ */
initSocket(server);

/* ============================
   MIDDLEWARES
============================ */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

/* ============================
   PUBLIC ROUTES
============================ */
app.use("/api/users", userRouter);
app.use("/api/reviews", reviewRoutes);

/* ============================
   PROTECTED ROUTES
============================ */
app.use(authenticate);

app.use("/api/bookings", bookingRouter);
app.use("/api/admin", adminRouter);

/* ============================
   DATABASE
============================ */
console.log("Connecting to URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

/* ============================
   SERVER
============================ */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});