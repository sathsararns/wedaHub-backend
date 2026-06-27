import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";


// routers

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB Connected");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});