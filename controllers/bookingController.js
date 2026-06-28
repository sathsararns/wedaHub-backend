import Booking from "../models/booking.js";
import { io } from "../index.js";

// CREATE BOOKING (Customer)
export const createBooking = async (req, res) => {
  try {
    const booking = new Booking({
      customerId: req.user.id,
      providerId: req.body.providerId,
      serviceName: req.body.serviceName,
      description: req.body.description,
      date: req.body.date,
    });

    await booking.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET BOOKINGS (Provider)
export const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      providerId: req.user.id,
    }).populate("customerId", "email firstName lastName");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE STATUS (Provider)
export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // 🔥 REALTIME NOTIFICATION
    io.emit("booking-updated", booking);

    res.json({
      message: "Updated",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerId: req.user.id,
    }).populate("providerId", "firstName lastName category");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // only owner can cancel
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // only pending can be cancelled
    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Cannot cancel after provider action",
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Not found" });
    }

    // only provider can complete
    if (booking.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.status = "completed";
    booking.serviceCompleted = true;

    await booking.save();

    res.json({
      message: "Service marked as completed",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addRating = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // only customer can rate completed booking
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Service not completed yet" });
    }

    booking.rating = rating;
    booking.review = review;

    await booking.save();

    res.json({
      message: "Rating submitted successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProviderRating = async (req, res) => {
  const providerId = req.params.id;

  const bookings = await Booking.find({
    providerId,
    rating: { $ne: null }
  });

  if (bookings.length === 0) {
    return res.json({ average: 0, totalReviews: 0 });
  }

  const avg =
    bookings.reduce((sum, b) => sum + b.rating, 0) /
    bookings.length;

  res.json({
    average: avg.toFixed(1),
    totalReviews: bookings.length
  });
};