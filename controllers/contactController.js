import ContactMessage from "../models/ContactMessage.js";

export const createMessage = async (req, res) => {
  try {
    const message = await ContactMessage.create({
      user: req.user._id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
}; 