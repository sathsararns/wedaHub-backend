import express from "express";
import User from "../models/user.js";
import Booking from "../models/booking.js";
import authenticate from "../middlewares/authenticate.js";
import adminOnly from "../middlewares/adminOnly.js";

const router = express.Router();

// GET ALL USERS
router.get("/users", authenticate, adminOnly, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// GET ALL BOOKINGS
router.get("/bookings", authenticate, adminOnly, async (req, res) => {
  const bookings = await Booking.find()
    .populate("customerId", "email firstName")
    .populate("providerId", "firstName lastName");

  res.json(bookings);
});

// BLOCK USER
router.put("/block/:id", authenticate, adminOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: true },
    { new: true }
  );

  res.json({ message: "User blocked", user });
});

// UNBLOCK USER
router.put("/unblock/:id", authenticate, adminOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: false },
    { new: true }
  );

  res.json({ message: "User unblocked", user });
});

export default router;