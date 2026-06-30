import Review from "../models/review.js";
import User from "../models/user.js";

// ======================================
// ADD REVIEW
// ======================================

export const addReview = async (req, res) => {
  try {
    const { providerId, rating, comment } = req.body;

    const provider = await User.findById(providerId);

    if (!provider) {
      return res.status(404).json({
        message: "Provider not found",
      });
    }

    if (provider.role !== "provider") {
      return res.status(400).json({
        message: "Invalid provider",
      });
    }

    // Prevent duplicate review

    const alreadyReviewed = await Review.findOne({
      provider: providerId,
      customer: req.user.id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You already reviewed this provider.",
      });
    }

    const review = await Review.create({
      provider: providerId,
      customer: req.user.id,
      rating,
      comment,
    });

    // ==========================
    // Recalculate Rating
    // ==========================

    const reviews = await Review.find({
      provider: providerId,
    });

    const total = reviews.reduce((sum, item) => {
      return sum + item.rating;
    }, 0);

    const average = total / reviews.length;

    provider.rating = Number(average.toFixed(1));
    provider.reviews = reviews.length;

    await provider.save();

    res.status(201).json({
      message: "Review Added Successfully",
      review,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================
// GET REVIEWS
// ======================================

export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      provider: req.params.providerId,
    })
      .populate("customer", "firstName lastName image")
      .sort({
        createdAt: -1,
      });

    res.json(reviews);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};