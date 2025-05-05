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
  roleMiddleware(["MANAGER"]),
  dosageFormController.addDosageForm
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  dosageFormController.editDosageForm
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  dosageFormController.deleteDosageForm
);

export default router;
