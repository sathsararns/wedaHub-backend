import {
  chatWithAI,
  createAIBooking,
  getBookingStatus as bookingStatus,
  getRecommendations as recommendationService,
} from "../services/aiService.js";

// =========================
// Chat
// =========================

export const chat = async (req, res) => {
  try {
    const { message, customer_id, customerId } = req.body;

    const customer = customer_id || customerId || null;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const result = await chatWithAI(message, customer);

    return res.json(result);
  } catch (err) {
    console.error("AI CHAT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// Booking
// =========================

export const createBooking = async (req, res) => {
  try {
    const result = await createAIBooking(req.body);

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// Booking Status
// =========================

export const getBookingStatus = async (req, res) => {
  try {
    const result = await bookingStatus(req.params.id);

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// Recommendation
// =========================

export const getRecommendations = async (req, res) => {
  try {
    const { service, location } = req.body;

    const result = await recommendationService(
      service,
      location
    );

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};