import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import http from "http";
import { Server } from "socket.io";

// routers
import userRouter from "./routers/userRouter.js";
import bookingRouter from "./routers/bookingRouter.js";
import adminRouter from "./routers/adminRouter.js";

import authenticate from "./middlewares/authenticate.js";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const server = http.createServer(app);

// 🔥 SOCKET SERVER
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// store io globally
export { io };

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);
app.use(authenticate);
app.use("/api/bookings", bookingRouter);

app.use("/api/admin", adminRouter);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB Connected");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});