// backend/routes/userRouter.js
import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Manager-only routes
router.post("/", roleMiddleware(["MANAGER"]), createUser);
router.get("/", roleMiddleware(["MANAGER"]), getAllUsers);
router.delete("/:id", roleMiddleware(["MANAGER"]), deleteUser);

// Manager and Employee-accessible routes
router.get("/:id", getUserById);
router.put("/:id", updateUser);

export default router;
