// controllers/authController.js
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// REGISTER - Basic version without password validation
export const createUser = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { email, password } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      ...req.body,
      password: passwordHash,
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};