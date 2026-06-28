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
