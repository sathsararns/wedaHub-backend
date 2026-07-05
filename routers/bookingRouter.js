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
} from "../controllers/bookingController.js";

const router = express.Router();

// Customer
router.post("/", authenticate, createBooking);

router.get("/customer", authenticate, getCustomerBookings);

router.delete("/:id", authenticate, cancelBooking);

// Provider
router.get("/provider", authenticate, getProviderBookings);

router.put("/:id", authenticate, updateBookingStatus);

router.put("/complete/:id", authenticate, completeBooking);

// Rating
router.put("/rate/:id", authenticate, addRating);

router.get("/rating/:id", getProviderRating);

export default router;