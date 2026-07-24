import User from "../models/user.js";
import Booking from "../models/booking.js";
import ContactMessage from "../models/ContactMessage.js";

// ==============================
// Dashboard
// ==============================

export const getDashboard = async (req, res) => {
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

    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBookings = await Booking.find()
      .populate("customerId", "firstName lastName email image")
      .populate("providerId", "firstName lastName businessName image")
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
};

export const getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};