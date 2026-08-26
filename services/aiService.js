import axios from "axios";

const AI_BASE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8000";

// =============================
// Chat
// =============================

export async function chatWithAI(
  message,
  customerId = null
) {
  try {
    const { data } = await axios.post(
      `${AI_BASE_URL}/chat`,
      {
        message,
        customer_id: customerId,
      }
    );

    return data;
  } catch (error) {
    console.error("AI Service:", error.message);

    throw new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        "Cannot connect to AI Service"
    );
  }
}

// =============================
// Booking
// =============================

export async function createAIBooking(
  bookingData
) {
  try {
    const { data } = await axios.post(
      `${AI_BASE_URL}/booking`,
      bookingData
    );

    return data;
  } catch (error) {
    console.error(error);

    throw new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        "Booking failed"
    );
  }
}

// =============================
// Booking Status
// =============================

export async function getBookingStatus(
  bookingId
) {
  try {
    const { data } = await axios.get(
      `${AI_BASE_URL}/booking/${bookingId}`
    );

    return data;
  } catch (error) {
    console.error(error);

    throw new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        "Booking status failed"
    );
  }
}

// =============================
// Recommendations
// =============================

export async function getRecommendations(
  service,
  location
) {
  try {
    const { data } = await axios.post(
      `${AI_BASE_URL}/recommend`,
      {
        service,
        location,
      }
    );

    return data;
  } catch (error) {
    console.error(error);

    throw new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        "Recommendation failed"
    );
  }
}