// import jwt from "jsonwebtoken";

// export default function (req, res, next) {
//   const header = req.headers.authorization;

//   if (!header) {
//     return res.status(401).json({ message: "No token" });
//   }

//   const token = header.replace("Bearer ", "");

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// }

import jwt from "jsonwebtoken";

export default function (req, res, next) {
  const header = req.headers.authorization;

  console.log("Authorization:", header);

  if (!header) {
    return res.status(401).json({ message: "No token" });
  }

  const token = header.replace("Bearer ", "");

  console.log("Token:", token);

  console.log("JWT_SECRET_KEY:", process.env.JWT_SECRET_KEY);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    console.log("Decoded:", decoded);

    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);

    return res.status(401).json({
      message: "Invalid token",
      error: err.message,
    });
  }
}