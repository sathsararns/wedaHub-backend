import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // =====================================================
    // CUSTOMER
    // =====================================================

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =====================================================
    // PROVIDER
    // =====================================================

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =====================================================
    // SERVICE
    // =====================================================

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    // Description of the work requested by customer
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // SERVICE LOCATION
    // =====================================================

    city: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // BOOKING DATE
    // =====================================================

    date: {
      type: Date,
      required: true,
    },

    // =====================================================
    // BOOKING TIME
    // =====================================================
    // Optional.
    //
    // AI booking does NOT require a time.
    // Web booking can optionally use this field.
    // Example:
    // "10:00 AM"
    // "14:00"
    //
    // =====================================================

    time: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // BOOKING STATUS
    // =====================================================

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "completed",
      ],
      default: "pending",
    },

    // =====================================================
    // BOOKING SOURCE
    // =====================================================

    source: {
      type: String,
      enum: ["web", "ai"],
      default: "web",
    },

    // =====================================================
    // SERVICE COMPLETION
    // =====================================================

    serviceCompleted: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // CUSTOMER RATING
    // =====================================================

    rating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },

    // =====================================================
    // CUSTOMER REVIEW
    // =====================================================

    review: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


// =========================================================
// MODEL
// =========================================================

const Booking = mongoose.model(
  "Booking",
  bookingSchema
);

export default Booking;