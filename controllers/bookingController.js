import Booking from "../models/booking.js";
import { getIO } from "../socket.js";
import * as chrono from "chrono-node";

/* =========================================================
   HELPER - PARSE BOOKING DATE
========================================================= */

const parseBookingDate = (dateInput) => {
  if (!dateInput) {
    return null;
  }

  // -------------------------------------------------------
  // Already a Date object
  // -------------------------------------------------------

  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime())
      ? null
      : dateInput;
  }

  const dateString = String(dateInput).trim();

  if (!dateString) {
    return null;
  }

  // -------------------------------------------------------
  // ISO date
  //
  // Example:
  // 2026-08-15
  // 2026-08-15T00:00:00.000Z
  // -------------------------------------------------------

  const isoDateRegex =
    /^\d{4}-\d{2}-\d{2}(T.*)?$/;

  if (isoDateRegex.test(dateString)) {
    const directDate = new Date(dateString);

    if (!isNaN(directDate.getTime())) {
      return directDate;
    }
  }

  // -------------------------------------------------------
  // Natural language date
  //
  // Examples:
  // Tomorrow
  // Friday
  // 15 August
  // August 15
  // Next Monday
  // -------------------------------------------------------

  const parsedDate = chrono.parseDate(
    dateString,
    new Date(),
    {
      forwardDate: true,
    }
  );

  if (
    !parsedDate ||
    isNaN(parsedDate.getTime())
  ) {
    return null;
  }

  return parsedDate;
};


/* =========================================================
   HELPER - POPULATE BOOKING
========================================================= */

const populateBooking = async (bookingId) => {
  return await Booking.findById(bookingId)
    .populate(
      "providerId",
      "firstName lastName category city phone image businessName"
    )
    .populate(
      "customerId",
      "firstName lastName phone image email"
    );
};


/* =========================================================
   CUSTOMER - CREATE NORMAL WEB BOOKING
========================================================= */

export const createBooking = async (req, res) => {
  try {
    const {
      providerId,
      serviceName,
      description,
      date,
      city,
      time,
    } = req.body;

    // -------------------------------------------------------
    // Provider validation
    // -------------------------------------------------------

    if (!providerId) {
      return res.status(400).json({
        message: "providerId is required",
      });
    }

    // -------------------------------------------------------
    // Date validation
    // -------------------------------------------------------

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const parsedDate = parseBookingDate(date);

    if (!parsedDate) {
      return res.status(400).json({
        message: `Invalid date format: ${date}`,
      });
    }

    // -------------------------------------------------------
    // Create booking
    // -------------------------------------------------------

    const booking = await Booking.create({
      customerId: req.user.id,

      providerId,

      serviceName:
        serviceName || "",

      description:
        description || "",

      city:
        city || "",

      date: parsedDate,

      // Web booking may have time
      time:
        time || "",

      status: "pending",

      source: "web",

      serviceCompleted: false,
    });

    // -------------------------------------------------------
    // Populate
    // -------------------------------------------------------

    const populatedBooking =
      await populateBooking(
        booking._id
      );

    // -------------------------------------------------------
    // Notify provider
    // -------------------------------------------------------

    const io = getIO();

    io.to(
      providerId.toString()
    ).emit(
      "new-booking",
      populatedBooking
    );

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(201).json({
      message:
        "Booking created successfully",

      booking:
        populatedBooking,
    });

  } catch (err) {

    console.error(
      "CREATE BOOKING ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   CUSTOMER - GET BOOKINGS
========================================================= */

export const getCustomerBookings = async (
  req,
  res
) => {
  try {

    const bookings =
      await Booking.find({
        customerId: req.user.id,
      })
        .populate(
          "providerId",
          "firstName lastName category city phone image businessName"
        )
        .sort({
          createdAt: -1,
        });

    return res.json(
      bookings
    );

  } catch (err) {

    console.error(
      "GET CUSTOMER BOOKINGS ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   PROVIDER - GET BOOKINGS
========================================================= */

export const getProviderBookings = async (
  req,
  res
) => {
  try {

    console.log(
      "Logged Provider ID:",
      req.user.id
    );

    const bookings =
      await Booking.find({
        providerId: req.user.id,
      })
        .populate(
          "customerId",
          "firstName lastName phone image email"
        )
        .sort({
          createdAt: -1,
        });

    console.log(
      "Provider Bookings:",
      bookings
    );

    return res.json(
      bookings
    );

  } catch (err) {

    console.error(
      "GET PROVIDER BOOKINGS ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   PROVIDER - ACCEPT / REJECT BOOKING
========================================================= */

export const updateBookingStatus = async (
  req,
  res
) => {
  try {

    const { status } =
      req.body;

    // -------------------------------------------------------
    // Validate status
    // -------------------------------------------------------

    if (
      ![
        "accepted",
        "rejected",
      ].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid status",
      });
    }

    // -------------------------------------------------------
    // Find booking
    // -------------------------------------------------------

    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found",
      });
    }

    // -------------------------------------------------------
    // Authorization
    // -------------------------------------------------------

    if (
      booking.providerId.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        message:
          "Unauthorized",
      });
    }

    // -------------------------------------------------------
    // Only pending bookings
    // -------------------------------------------------------

    if (
      booking.status !==
      "pending"
    ) {
      return res.status(400).json({
        message:
          "Booking already processed",
      });
    }

    // -------------------------------------------------------
    // Update
    // -------------------------------------------------------

    booking.status =
      status;

    await booking.save();

    // -------------------------------------------------------
    // Populate
    // -------------------------------------------------------

    const updatedBooking =
      await populateBooking(
        booking._id
      );

    // -------------------------------------------------------
    // Socket notifications
    // -------------------------------------------------------

    const io = getIO();

    if (booking.customerId) {

      io.to(
        booking.customerId.toString()
      ).emit(
        "booking-status-updated",
        updatedBooking
      );
    }

    io.to(
      booking.providerId.toString()
    ).emit(
      "booking-status-updated",
      updatedBooking
    );

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.json({
      message:
        `Booking ${status} successfully`,

      booking:
        updatedBooking,
    });

  } catch (err) {

    console.error(
      "UPDATE BOOKING STATUS ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   PROVIDER - COMPLETE BOOKING
========================================================= */

export const completeBooking = async (
  req,
  res
) => {
  try {

    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found",
      });
    }

    // -------------------------------------------------------
    // Authorization
    // -------------------------------------------------------

    if (
      booking.providerId.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        message:
          "Unauthorized",
      });
    }

    // -------------------------------------------------------
    // Must be accepted
    // -------------------------------------------------------

    if (
      booking.status !==
      "accepted"
    ) {
      return res.status(400).json({
        message:
          "Booking must be accepted first",
      });
    }

    // -------------------------------------------------------
    // Complete
    // -------------------------------------------------------

    booking.status =
      "completed";

    booking.serviceCompleted =
      true;

    await booking.save();

    // -------------------------------------------------------
    // Populate
    // -------------------------------------------------------

    const updatedBooking =
      await populateBooking(
        booking._id
      );

    // -------------------------------------------------------
    // Socket
    // -------------------------------------------------------

    const io = getIO();

    if (booking.customerId) {

      io.to(
        booking.customerId.toString()
      ).emit(
        "booking-status-updated",
        updatedBooking
      );
    }

    io.to(
      booking.providerId.toString()
    ).emit(
      "booking-status-updated",
      updatedBooking
    );

    return res.json({
      message:
        "Service completed successfully",

      booking:
        updatedBooking,
    });

  } catch (err) {

    console.error(
      "COMPLETE BOOKING ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   CUSTOMER - CANCEL BOOKING
========================================================= */

export const cancelBooking = async (
  req,
  res
) => {
  try {

    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found",
      });
    }

    // -------------------------------------------------------
    // Authorization
    // -------------------------------------------------------

    if (
      !booking.customerId ||
      booking.customerId.toString() !==
        req.user.id
    ) {
      return res.status(403).json({
        message:
          "Unauthorized",
      });
    }

    // -------------------------------------------------------
    // Only pending can cancel
    // -------------------------------------------------------

    if (
      booking.status !==
      "pending"
    ) {
      return res.status(400).json({
        message:
          "Cannot cancel after provider action",
      });
    }

    const providerId =
      booking.providerId.toString();

    const bookingId =
      booking._id;

    // -------------------------------------------------------
    // Delete
    // -------------------------------------------------------

    await booking.deleteOne();

    // -------------------------------------------------------
    // Notify provider
    // -------------------------------------------------------

    const io = getIO();

    io.to(providerId).emit(
      "booking-status-updated",
      {
        _id: bookingId,
        status: "cancelled",
      }
    );

    return res.json({
      message:
        "Booking cancelled successfully",
    });

  } catch (err) {

    console.error(
      "CANCEL BOOKING ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   CUSTOMER - ADD RATING
========================================================= */

export const addRating = async (
  req,
  res
) => {
  try {

    const {
      rating,
      review,
    } = req.body;

    const numericRating =
      Number(rating);

    // -------------------------------------------------------
    // Validate
    // -------------------------------------------------------

    if (
      !Number.isInteger(
        numericRating
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message:
          "Rating must be between 1 and 5",
      });
    }

    // -------------------------------------------------------
    // Find booking
    // -------------------------------------------------------

    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found",
      });
    }

    // -------------------------------------------------------
    // Authorization
    // -------------------------------------------------------

    if (
      !booking.customerId ||
      booking.customerId.toString() !==
        req.user.id
    ) {
      return res.status(403).json({
        message:
          "Unauthorized",
      });
    }

    // -------------------------------------------------------
    // Must be completed
    // -------------------------------------------------------

    if (
      booking.status !==
      "completed"
    ) {
      return res.status(400).json({
        message:
          "Service not completed",
      });
    }

    // -------------------------------------------------------
    // Save
    // -------------------------------------------------------

    booking.rating =
      numericRating;

    booking.review =
      review || "";

    await booking.save();

    return res.json({
      message:
        "Rating submitted successfully",

      booking,
    });

  } catch (err) {

    console.error(
      "ADD RATING ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   PROVIDER - GET RATING
========================================================= */

export const getProviderRating = async (
  req,
  res
) => {
  try {

    const bookings =
      await Booking.find({
        providerId:
          req.params.id,

        rating: {
          $ne: null,
        },
      });

    if (
      bookings.length ===
      0
    ) {
      return res.json({
        average: 0,
        totalReviews: 0,
      });
    }

    const average =
      bookings.reduce(
        (sum, booking) =>
          sum + booking.rating,
        0
      ) / bookings.length;

    return res.json({
      average:
        Number(
          average.toFixed(1)
        ),

      totalReviews:
        bookings.length,
    });

  } catch (err) {

    console.error(
      "GET PROVIDER RATING ERROR:",
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* =========================================================
   AI BOOKING
========================================================= */

export const createAIBooking = async (
  req,
  res
) => {

  console.log(
    "\n===== AI BOOKING BODY ====="
  );

  console.log(
    JSON.stringify(
      req.body,
      null,
      2
    )
  );

  try {

    const {
      providerId,
      customerId,
      service,
      description,
      date,
      city,
    } = req.body;

    // =====================================================
    // PROVIDER VALIDATION
    // =====================================================

    if (!providerId) {
      return res.status(400).json({
        message:
          "providerId is required",
      });
    }

    // =====================================================
    // CUSTOMER VALIDATION
    // =====================================================

    if (!customerId) {
      return res.status(400).json({
        message:
          "customerId is required",
      });
    }

    // =====================================================
    // SERVICE VALIDATION
    // =====================================================

    if (
      !service ||
      !String(service).trim()
    ) {
      return res.status(400).json({
        message:
          "service is required",
      });
    }

    // =====================================================
    // DESCRIPTION VALIDATION
    //
    // IMPORTANT:
    // AI booking MUST have description.
    // Time is NOT required.
    // =====================================================

    if (
      !description ||
      !String(description).trim()
    ) {
      return res.status(400).json({
        message:
          "description is required",
      });
    }

    // =====================================================
    // DATE VALIDATION
    // =====================================================

    if (!date) {
      return res.status(400).json({
        message:
          "date is required",
      });
    }

    // =====================================================
    // PARSE DATE
    // =====================================================

    const parsedDate =
      parseBookingDate(date);

    console.log(
      "\n===== DATE PARSING ====="
    );

    console.log(
      "Original date:",
      date
    );

    console.log(
      "Parsed date:",
      parsedDate
    );

    if (!parsedDate) {
      return res.status(400).json({
        message:
          `Invalid date format: "${date}". ` +
          `Please provide a date such as "tomorrow" or "15 August".`,
      });
    }

    // =====================================================
    // CREATE BOOKING
    //
    // IMPORTANT:
    // time is intentionally empty.
    // =====================================================

    const booking =
      await Booking.create({

        customerId,

        providerId,

        serviceName:
          String(service).trim(),

        description:
          String(description).trim(),

        city:
          city
            ? String(city).trim()
            : "",

        date:
          parsedDate,

        time: "",

        status:
          "pending",

        source:
          "ai",

        serviceCompleted:
          false,
      });

    console.log(
      "\n===== AI BOOKING CREATED ====="
    );

    console.log({
      id:
        booking._id,

      providerId:
        booking.providerId,

      customerId:
        booking.customerId,

      service:
        booking.serviceName,

      description:
        booking.description,

      city:
        booking.city,

      date:
        booking.date,

      time:
        booking.time,

      status:
        booking.status,

      source:
        booking.source,
    });

    // =====================================================
    // POPULATE
    // =====================================================

    const populatedBooking =
      await populateBooking(
        booking._id
      );

    // =====================================================
    // SOCKET NOTIFICATION
    // =====================================================

    const io = getIO();

    io.to(
      providerId.toString()
    ).emit(
      "new-booking",
      populatedBooking
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({

      message:
        "AI booking created successfully",

      booking:
        populatedBooking,
    });

  } catch (err) {

    console.error(
      "\n===== AI BOOKING ERROR ====="
    );

    console.error(err);

    return res.status(500).json({
      message:
        err.message,
    });
  }
};


/* =========================================================
   GET BOOKING BY ID
========================================================= */

export const getBookingById = async (
  req,
  res
) => {
  try {

    const booking =
      await Booking.findById(
        req.params.id
      )
        .populate(
          "providerId",
          "firstName lastName city phone category image businessName"
        )
        .populate(
          "customerId",
          "firstName lastName phone email image"
        );

    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found",
      });
    }

    return res.json(
      booking
    );

  } catch (err) {

    console.error(
      "GET BOOKING BY ID ERROR:",
      err
    );

    return res.status(500).json({
      message:
        err.message,
    });
  }
};