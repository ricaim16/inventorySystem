import express from "express";
import { dosageFormController } from "../controllers/dosageFormController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  dosageFormController.getAllDosageForms
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  dosageFormController.addDosageForm
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  dosageFormController.editDosageForm
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  dosageFormController.deleteDosageForm
);

export default router;
