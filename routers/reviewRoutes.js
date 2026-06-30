import express from "express";

import authenticate from "../middlewares/authenticate.js";

import {
  addReview,
  getReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

// Add Review
router.post("/", authenticate, addReview);

// Get Reviews of Provider
router.get("/:providerId", getReviews);

export default router;