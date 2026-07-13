import express from "express";
import User from "../models/user.js";
import Booking from "../models/booking.js";

import authenticate from "../middlewares/authenticate.js";
import adminOnly from "../middlewares/adminOnly.js";

const router = express.Router();

/* =========================================
   ADMIN DASHBOARD
========================================= */

router.get(
  "/dashboard",
  authenticate,
  adminOnly,
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();

      const totalCustomers = await User.countDocuments({
        role: "customer",
      });

      const totalProviders = await User.countDocuments({
        role: "provider",
      });

      const totalBookings = await Booking.countDocuments();

      const pendingBookings = await Booking.countDocuments({
        status: "pending",
      });

      const recentUsers = await User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5);

      const recentBookings = await Booking.find()
        .populate(
          "customerId",
          "firstName lastName email image"
        )
        .populate(
          "providerId",
          "firstName lastName businessName image"
        )
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        stats: {
          totalUsers,
          totalCustomers,
          totalProviders,
          totalBookings,
          pendingBookings,
        },

        recentUsers,
        recentBookings,
      });

    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

/* =========================================
   USERS
========================================= */

router.get(
  "/users",
  authenticate,
  adminOnly,
  async (req, res) => {
    const users = await User.find().select("-password");

    res.json(users);
  }
);

/* =========================================
   BOOKINGS
========================================= */

router.get(
  "/bookings",
  authenticate,
  adminOnly,
  async (req, res) => {
    const bookings = await Booking.find()
      .populate(
        "customerId",
        "firstName lastName email image"
      )
      .populate(
        "providerId",
        "firstName lastName businessName image"
      );

    res.json(bookings);
  }
);

/* =========================================
   BLOCK USER
========================================= */

router.put(
  "/block/:id",
  authenticate,
  adminOnly,
  async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );

    res.json({
      message: "User blocked",
      user,
    });
  }
);

/* =========================================
   UNBLOCK USER
========================================= */

router.put(
  "/unblock/:id",
  authenticate,
  adminOnly,
  async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );

    res.json({
      message: "User unblocked",
      user,
    });
  }
);

export default router;