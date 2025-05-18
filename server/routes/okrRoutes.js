import express from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import {
  createObjective,
  createKeyResult,
  getObjectives,
  updateKeyResultProgress,
  editObjective,
  deleteObjective,
  editKeyResult,
  deleteKeyResult,
} from "../controllers/okrController.js";

const router = express.Router();

console.log("Registering OKR routes...");

router.post(
  "/objectives",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  createObjective
);

router.post(
  "/key-results",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  createKeyResult
);

router.get(
  "/objectives",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  getObjectives
);

router.put(
  "/key-results/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  updateKeyResultProgress
);

router.put(
  "/objectives/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  editObjective
);

router.delete(
  "/objectives/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  deleteObjective
);

router.put(
  "/key-results/:id/edit",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  editKeyResult
);

router.delete(
  "/key-results/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  deleteKeyResult
);

export default router;
