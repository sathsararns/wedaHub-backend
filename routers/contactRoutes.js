import express from "express";
import { createMessage } from "../controllers/contactController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, createMessage);

export default router;