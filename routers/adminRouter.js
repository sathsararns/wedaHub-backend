import express from "express";
import User from "../models/user.js";
import Booking from "../models/booking.js";

import authenticate from "../middlewares/authenticate.js";
import adminOnly from "../middlewares/adminOnly.js";

import { getDashboard } from "../controllers/adminController.js";

const router = express.Router();

// ==============================
// Dashboard
// ==============================

router.get(
  "/dashboard",
  authenticate,
  adminOnly,
  getDashboard
);

// ==============================
// Users
// ==============================

router.get(
  "/users",
  authenticate,
  adminOnly,
  async (req, res) => {
    try {
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// ==============================
// Bookings
// ==============================

router.get(
  "/bookings",
  authenticate,
  adminOnly,
  async (req, res) => {
    try {
      const bookings = await Booking.find()
        .populate(
          "customerId",
          "firstName lastName email image"
        )
        .populate(
          "providerId",
          "firstName lastName businessName image"
        )
        .sort({ createdAt: -1 });

      res.json(bookings);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// ==============================
// Block User
// ==============================

router.put(
  "/block/:id",
  authenticate,
  adminOnly,
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBlocked: true },
        { new: true }
      );

      res.json({
        message: "User blocked",
        user,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// ==============================
// Unblock User
// ==============================

router.put(
  "/unblock/:id",
  authenticate,
  adminOnly,
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBlocked: false },
        { new: true }
      );

      res.json({
        message: "User unblocked",
        user,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

export default router;