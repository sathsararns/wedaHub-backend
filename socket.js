import { Server } from "socket.io";
import { getCorsOptions } from "./config.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      ...getCorsOptions(),
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    socket.on("join-room", (userId) => {
      if (!userId) return;

      socket.join(userId);

      console.log(`User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
      console.log("Socket Disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
