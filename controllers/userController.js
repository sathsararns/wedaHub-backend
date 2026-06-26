// controllers/authController.js
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ✅ PASSWORD VALIDATION FUNCTION
function isStrongPassword(password) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*]/.test(password);

  return minLength && hasUpper && hasLower && hasNumber && hasSymbol;
}

// REGISTER
export const createUser = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { email, password } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // password check
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars with uppercase, lowercase, number & symbol",
      });
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