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
   AI Booking
============================ */

router.post("/ai", createAIBooking);

/* ============================
   Customer
============================ */

router.post("/", authenticate, createBooking);

router.get("/customer", authenticate, getCustomerBookings);

/* ============================
   Provider
============================ */

router.get("/provider", authenticate, getProviderBookings);

router.put("/:id", authenticate, updateBookingStatus);

router.put("/complete/:id", authenticate, completeBooking);

/* ============================
   Rating
============================ */

router.get("/rating/:id", getProviderRating);

router.put("/rate/:id", authenticate, addRating);

/* ============================
   Cancel
============================ */

router.delete("/:id", authenticate, cancelBooking);

/* ============================
   Get Booking By ID
   (ALWAYS LAST)
============================ */

router.get("/:id", getBookingById);

export default router;