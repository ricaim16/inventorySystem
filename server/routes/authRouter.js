import express from "express";
import { login } from "../controllers/authController.js"; // Updated import

const router = express.Router();

// Public route for login
router.post("/login", login);

export default router;
