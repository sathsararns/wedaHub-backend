import Booking from "../models/booking.js";
import { io } from "../index.js";

// =======================================
// Create Booking
// =======================================

export const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      customerId: req.user.id,
      providerId: req.body.providerId,
      serviceName: req.body.serviceName,
      description: req.body.description,
      date: req.body.date,
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// Customer Bookings
// =======================================

export const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerId: req.user.id,
    })
      .populate(
        "providerId",
        "firstName lastName category phone location image"
      )
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// Provider Bookings
// =======================================

export const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      providerId: req.user.id,
    })
      .populate(
        "customerId",
        "firstName lastName phone email"
      )
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// Update Booking Status
// =======================================

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.providerId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    booking.status = req.body.status;

    await booking.save();

    io.emit("booking-updated", booking);

    res.json({
      message: "Booking updated successfully",
      booking,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// Cancel Booking
// =======================================

export const cancelBooking = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Cannot cancel this booking",
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      message: "Booking cancelled successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// Complete Booking
// =======================================

export const completeBooking = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.providerId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    booking.status = "completed";
    booking.serviceCompleted = true;

    await booking.save();

    res.json({
      message: "Completed successfully",
      booking,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// Add Rating
// =======================================

export const addRating = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    booking.rating = req.body.rating;
    booking.review = req.body.review;

    await booking.save();

    res.json({
      message: "Rating submitted",
      booking,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// Provider Rating
// =======================================

export const getProviderRating = async (req, res) => {
  try {

    const bookings = await Booking.find({
      providerId: req.params.id,
      rating: {
        $ne: null,
      },
    });

    if (bookings.length === 0) {
      return res.json({
        average: 0,
        totalReviews: 0,
      });
    }

    const average =
      bookings.reduce((sum, booking) => sum + booking.rating, 0) /
      bookings.length;

    res.json({
      average: average.toFixed(1),
      totalReviews: bookings.length,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};