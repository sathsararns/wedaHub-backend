import express from "express";
import {
  createUser,
  loginUser,
  getProfile,
  updateProfile,
  
} from "../controllers/userController.js";

import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

export default router;