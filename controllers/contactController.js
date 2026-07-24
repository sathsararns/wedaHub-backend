import ContactMessage from "../models/ContactMessage.js";

export const createMessage = async (req, res) => {
  try {
    const message = await ContactMessage.create({
      user: req.user.id, // ✅ FIXED
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: message,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};