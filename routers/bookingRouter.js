import express from "express";
import {
  createBooking,
  getProviderBookings,
  updateBookingStatus,
  getCustomerBookings,
  cancelBooking,
  completeBooking,
  addRating,
  getProviderRating
} from "../controllers/bookingController.js";

const router = express.Router();

// customer creates booking
router.post("/", createBooking);

// provider sees bookings
router.get("/", getProviderBookings);

// provider updates booking status
router.put("/:id", updateBookingStatus);

router.get("/customer", getCustomerBookings);

router.delete("/:id", cancelBooking);

router.put("/complete/:id", completeBooking);

router.put("/rate/:id", addRating);

router.get("/rating/:id", getProviderRating);

export default router;