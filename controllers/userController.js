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

    // ✅ FIX: define existing user
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

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      isAdmin: user.isAdmin,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// 🔥 ADD THIS BELOW getProfile
export const updateProfile = async (req, res) => {
  try {

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        address: req.body.address,
        location: req.body.location,
        image: req.body.image || undefined,
      },
      {
        new: true,
      }
    ).select("-password");

    res.json(updatedUser);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};