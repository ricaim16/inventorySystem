import express from "express";
import { expenseController } from "../controllers/expenseController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// Serve uploaded files statically
router.use("/uploads", express.static("uploads"));

// Routes
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  expenseController.addExpense
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  expenseController.getAllExpenses
);

router.get(
  "/report",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  expenseController.getExpenseReport
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  expenseController.updateExpense
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  expenseController.deleteExpense
);

export default router;
