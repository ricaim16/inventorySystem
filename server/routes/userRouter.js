import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  checkEmail,
} from "../controllers/userController.js";
import { login } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// Public route (no authentication required)
router.post("/login", login);

// Protected routes
router.use(authMiddleware);

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/check-email", checkEmail);

export default router;
