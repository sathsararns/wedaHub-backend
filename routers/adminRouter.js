import express from "express";
import User from "../models/user.js";
import Booking from "../models/booking.js";

import authenticate from "../middlewares/authenticate.js";
import adminOnly from "../middlewares/adminOnly.js";

import {
  getDashboardStats,
  getRecentUsers,
  getRecentBookings,
} from "../controllers/adminController.js";

const router = express.Router();

/* =========================================
   Dashboard
========================================= */

router.get(
  "/dashboard/stats",
  authenticate,
  adminOnly,
  getDashboardStats
);

router.get(
  "/dashboard/recent-users",
  authenticate,
  adminOnly,
  getRecentUsers
);

router.get(
  "/dashboard/recent-bookings",
  authenticate,
  adminOnly,
  getRecentBookings
);

/* =========================================
   All Users
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
   All Bookings
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
   Block User
========================================= */

router.put(
  "/block/:id",
  authenticate,
  adminOnly,
  async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );

    res.json({
      message: "User blocked",
      user,
    });
  }
);

/* =========================================
   Unblock User
========================================= */

router.put(
  "/unblock/:id",
  authenticate,
  adminOnly,
  async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );

    res.json({
      message: "User unblocked",
      user,
    });
  }
);

// ==============================
// ADMIN DASHBOARD STATS
// ==============================

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
          "firstName lastName email"
        )
        .populate(
          "providerId",
          "firstName lastName businessName"
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

export default router;