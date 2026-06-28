import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    serviceName: {
      type: String,
      required: true,
    },

    description: String,

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    serviceCompleted: {
      type: Boolean,
      default: false
    },rating: {
      type: Number,
      default: null
    },
    review: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);