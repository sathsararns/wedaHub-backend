import express from "express";
import authenticate from "../middlewares/authenticate.js";

import {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  updateBookingStatus,
  cancelBooking,
  completeBooking,
  addRating,
  getProviderRating,
  createAIBooking,
  getBookingById,
} from "../controllers/bookingController.js";

const router = express.Router();

/* ============================
   AI Booking (PUBLIC)
============================ */

router.post("/ai", createAIBooking);

/* ============================
   Get Booking By ID (PUBLIC)
============================ */

router.get("/:id", getBookingById);

/* ============================
   Customer (PROTECTED)
============================ */

router.post("/", authenticate, createBooking);
router.get("/customer", authenticate, getCustomerBookings);
router.delete("/:id", authenticate, cancelBooking);

/* ============================
   Provider (PROTECTED)
============================ */

router.get("/provider", authenticate, getProviderBookings);
router.put("/:id", authenticate, updateBookingStatus);
router.put("/complete/:id", authenticate, completeBooking);

/* ============================
   Rating
============================ */

// Public
router.get("/rating/:id", getProviderRating);

// Protected
router.put("/rate/:id", authenticate, addRating);

export default router;