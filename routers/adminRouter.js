import express from "express";
import User from "../models/user.js";
import Booking from "../models/booking.js";

import authenticate from "../middlewares/authenticate.js";
import adminOnly from "../middlewares/adminOnly.js";

import { getDashboard } from "../controllers/adminController.js";
import { getIO } from "../socket.js";

const router = express.Router();

/* ======================================
            DASHBOARD
====================================== */

router.get(
  "/dashboard",
  authenticate,
  adminOnly,
  getDashboard
);

/* ======================================
              USERS
====================================== */

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

/* ======================================
            BOOKINGS
====================================== */

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

/* ======================================
            BLOCK USER
====================================== */

router.put(
  "/block/:id",
  authenticate,
  adminOnly,
  async (req, res) => {
    try {

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          isBlocked: true,
        },
        {
          new: true,
        }
      );

      // 🔥 Realtime Logout
      const io = getIO();

      io.to(user._id.toString()).emit("force-logout", {
        message: "Your account has been blocked by the administrator.",
      });

      res.json({
        message: "User blocked successfully.",
        user,
      });

    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

/* ======================================
            UNBLOCK USER
====================================== */

router.put(
  "/unblock/:id",
  authenticate,
  adminOnly,
  async (req, res) => {
    try {

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          isBlocked: false,
        },
        {
          new: true,
        }
      );

      // Optional Notification
      const io = getIO();

      io.to(user._id.toString()).emit("user-unblocked", {
        message: "Your account has been activated by the administrator.",
      });

      res.json({
        message: "User unblocked successfully.",
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