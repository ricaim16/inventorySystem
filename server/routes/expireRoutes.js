import express from "express";
import { expireController } from "../controllers/expireController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// Routes for expiration management
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  expireController.getExpiredMedicines
);

router.get(
  "/alerts",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  expireController.getExpirationAlerts
);

router.get(
  "/report",
  authMiddleware,
  roleMiddleware(["MANAGER"]), // Restricted to MANAGER only
  expireController.generateExpirationReport
);


export default router;
