import express from "express";
import { forgotPassword, login, verifyOtp, updatePassword } from "../controllers/authController.js"; // Updated import

const router = express.Router();

// Public route for login
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyOtp", verifyOtp);
router.post("/updatePassword", updatePassword);

export default router;
