export default function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "No token" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin only" });
  }

  next();
}