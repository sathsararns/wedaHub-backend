import express from "express";
import {
  chat,
  createBooking,
  getBookingStatus,
  getRecommendations,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", chat);

router.post("/booking", createBooking);

router.get("/booking/:id", getBookingStatus);

router.post("/recommend", getRecommendations);

export default router;