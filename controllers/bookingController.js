import Booking from "../models/booking.js";
import { io } from "../index.js";

/* ============================
   CUSTOMER - CREATE BOOKING
============================ */
export const createBooking = async (req, res) => {
  try {
    const {
      providerId,
      serviceName,
      description,
      date,
    } = req.body;

    const booking = await Booking.create({
      customerId: req.user.id,
      providerId,
      serviceName,
      description,
      date,
      status: "pending",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate(
        "providerId",
        "firstName lastName category location phone image businessName"
      )
      .populate(
        "customerId",
        "firstName lastName phone image email"
      );

    // Notify Provider
    io.to(providerId.toString()).emit(
      "new-booking",
      populatedBooking
    );

    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ============================
   CUSTOMER BOOKINGS
============================ */
export const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerId: req.user.id,
    })
      .populate(
        "providerId",
        "firstName lastName category location phone image businessName"
      )
      .sort({
        createdAt: -1,
      });

    res.json(bookings);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ============================
   PROVIDER BOOKINGS
============================ */
export const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      providerId: req.user.id,
    })
      .populate(
        "customerId",
        "firstName lastName phone image email"
      )
      .sort({
        createdAt: -1,
      });

    res.json(bookings);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ============================
   ACCEPT / REJECT
============================ */
export const updateBookingStatus = async (req, res) => {
  try {

    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

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

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Booking already processed",
      });
    }

    booking.status = status;

    await booking.save();

    const updatedBooking = await Booking.findById(
      booking._id
    )
      .populate(
        "providerId",
        "firstName lastName category location phone image businessName"
      )
      .populate(
        "customerId",
        "firstName lastName phone image email"
      );

    // Notify Customer
    io.to(booking.customerId.toString()).emit(
      "booking-updated",
      updatedBooking
    );

    res.json({
      message: `Booking ${status}`,
      booking: updatedBooking,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ============================
   COMPLETE SERVICE
============================ */
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

    if (booking.status !== "accepted") {
      return res.status(400).json({
        message: "Booking must be accepted first",
      });
    }

    booking.status = "completed";
    booking.serviceCompleted = true;

    await booking.save();

    const updatedBooking = await Booking.findById(
      booking._id
    )
      .populate(
        "providerId",
        "firstName lastName category location phone image businessName"
      )
      .populate(
        "customerId",
        "firstName lastName phone image email"
      );

    io.to(booking.customerId.toString()).emit(
      "booking-updated",
      updatedBooking
    );

    res.json({
      message: "Service completed successfully",
      booking: updatedBooking,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ============================
   CUSTOMER CANCEL
============================ */
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
        message: "Cannot cancel after provider action",
      });
    }

    await booking.deleteOne();

    io.to(booking.providerId.toString()).emit(
      "booking-cancelled",
      booking._id
    );

    res.json({
      message: "Booking cancelled successfully",
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ============================
   CUSTOMER RATING
============================ */
export const addRating = async (req, res) => {
  try {

    const { rating, review } = req.body;

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

    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "Service not completed",
      });
    }

    booking.rating = rating;
    booking.review = review;

    await booking.save();

    res.json({
      message: "Rating submitted successfully",
      booking,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ============================
   PROVIDER RATING
============================ */
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
      bookings.reduce(
        (sum, booking) => sum + booking.rating,
        0
      ) / bookings.length;

    res.json({
      average: Number(average.toFixed(1)),
      totalReviews: bookings.length,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};