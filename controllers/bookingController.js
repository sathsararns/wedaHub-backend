import Booking from "../models/booking.js";
import { getIO } from "../socket.js";

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
    const io = getIO();

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
    console.log("Logged Provider ID:", req.user.id);

    const bookings = await Booking.find({
      providerId: req.user.id,
    })
      .populate(
        "customerId",
        "firstName lastName phone image email"
      )
      .sort({ createdAt: -1 });

    console.log("Provider Bookings:", bookings);

    res.json(bookings);

  } catch (err) {
    console.log(err);

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

    const updatedBooking = await Booking.findById(booking._id)
      .populate(
        "providerId",
        "firstName lastName category location phone image businessName"
      )
      .populate(
        "customerId",
        "firstName lastName phone image email"
      );

    // Notify Customer and Provider
    const io = getIO();

    io.to(booking.customerId.toString()).emit(
      "booking-status-updated",
      updatedBooking
    );

    io.to(booking.providerId.toString()).emit(
      "booking-status-updated",
      updatedBooking
    );

    // ✅ Response
    return res.json({
      message: `Booking ${status} successfully`,
      booking: updatedBooking,
    });

  } catch (err) {
    return res.status(500).json({
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

    const io = getIO();

    io.to(booking.customerId.toString()).emit(
      "booking-status-updated",
      updatedBooking
    );

    io.to(booking.providerId.toString()).emit(
      "booking-status-updated",
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

    const io = getIO();

    io.to(booking.providerId.toString()).emit(
      "booking-status-updated",
      {
        _id: booking._id,
        status: "cancelled",
      }
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

/* ============================
   AI BOOKING
============================ */
export const createAIBooking = async (req, res) => {
  console.log("===== AI BOOKING BODY =====");
  console.log(req.body);

  try {
    const {
      providerId,
      customerId,
      service,
      date,
      time,
    } = req.body;

    // Validation
    if (!providerId) {
      return res.status(400).json({
        message: "providerId is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    if (!time) {
      return res.status(400).json({
        message: "time is required",
      });
    }

    const booking = await Booking.create({
      customerId: customerId || null,
      providerId,
      serviceName: service || "General Service",
      date: new Date(date),
      time,
      status: "pending",
      source: "ai",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate(
        "providerId",
        "firstName lastName category phone image city district"
      )
      .populate(
        "customerId",
        "firstName lastName phone email image"
      );

    // Notify provider if connected
    const io = getIO();

    io.to(providerId.toString()).emit(
      "new-booking",
      populatedBooking
    );

    return res.status(201).json({
      message: "AI booking created successfully",
      booking: populatedBooking,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* ============================
   GET BOOKING BY ID (AI)
============================ */
export const getBookingById = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id)
      .populate(
        "providerId",
        "firstName lastName phone city district category image"
      )
      .populate(
        "customerId",
        "firstName lastName phone email image"
      );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    return res.json(booking);

  } catch (err) {

    return res.status(500).json({
      message: err.message,
    });

  }
};