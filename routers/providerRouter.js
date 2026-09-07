import express from "express";
import { searchProviders } from "../controllers/providerController.js";

const router = express.Router();

// Public route for AI search
router.get("/search", searchProviders);

export default router;