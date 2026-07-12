import User from "../models/user.js";
import Booking from "../models/booking.js";

/* =========================================
   Dashboard Statistics
========================================= */

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      totalBookings,
      pendingBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "provider" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
    ]);

    res.json({
      totalUsers,
      totalCustomers,
      totalProviders,
      totalBookings,
      pendingBookings,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================================
   Recent Users
========================================= */

export const getRecentUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "firstName lastName email role image createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================================
   Recent Bookings
========================================= */

export const getRecentBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate(
        "customerId",
        "firstName lastName image"
      )
      .populate(
        "providerId",
        "firstName lastName businessName image"
      )
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(bookings);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};