// middleware/auth.js
import jwt from "jsonwebtoken";

export default function (req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "No token" });
  }

  // TODO: Implement token verification
  next();
}