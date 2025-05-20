import express from "express";
import { returnsController } from "../controllers/returnsController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", returnsController.getAllReturns);
router.get("/:id", returnsController.getReturnById);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  returnsController.addReturn
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  returnsController.editReturn
);


router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  returnsController.deleteReturn
);

export default router;
