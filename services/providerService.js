import User from "../models/user.js";

export const search = async (service, location) => {
  return await User.find({
    role: "provider",
    isBlocked: false,
    category: { $regex: new RegExp(service, "i") },
    district: { $regex: new RegExp(location, "i") },
  }).select("-password");
};