import jwt from "jsonwebtoken";

export default function (req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Please log in to continue.", code: "AUTH_REQUIRED" });
  }

  const match = /^\s*Bearer\s+(\S+)\s*$/i.exec(header);
  if (!match) {
    return res.status(401).json({ message: "Invalid authorization header.", code: "INVALID_TOKEN" });
  }
  if (!process.env.JWT_SECRET_KEY) {
    return res.status(500).json({ message: "Authentication is not configured on the server.", code: "AUTH_CONFIG_ERROR" });
  }

  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET_KEY);
    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return res.status(401).json({ message: "Invalid session. Please log in again.", code: "INVALID_TOKEN" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return res.status(401).json({
      message: expired ? "Session expired. Please log in again." : "Invalid session. Please log in again.",
      code: expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
    });
  }
}
