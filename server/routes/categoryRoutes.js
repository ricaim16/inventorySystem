import express from "express";
import { categoryController } from "../controllers/categoryController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  categoryController.getAllCategories
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  categoryController.addCategory
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  categoryController.editCategory
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]), // Add EMPLOYEE here
  categoryController.deleteCategory
);

export default router;
