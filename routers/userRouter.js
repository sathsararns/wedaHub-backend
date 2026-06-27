import express from "express";
import {
  createUser,
  loginUser,
  
} from "../controllers/userController.js";

import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);

export default router;