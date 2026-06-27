import express from "express";
import {
  createUser,

} from "../controllers/userController.js";

import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/register", createUser);


export default router;