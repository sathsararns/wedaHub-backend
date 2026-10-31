import express from "express";
import { chat, chatStream, resetChat, health } from "../controllers/aiController.js";

const router = express.Router();

router.get("/health", health);

router.post("/chat", chat);

router.post("/chat/stream", chatStream);

router.post("/chat/reset", resetChat);

export default router;
