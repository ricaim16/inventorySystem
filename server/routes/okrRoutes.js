import express from "express";
import * as okrController from "../controllers/okrController.js";

const router = express.Router();

router.post("/objectives", okrController.createObjective);
router.get("/objectives", okrController.getObjectives);
router.put("/objectives/:id", okrController.updateObjective);
router.delete("/objectives/:id", okrController.deleteObjective);

router.post("/keyresults", okrController.createKeyResult);
router.put("/keyresults/:id", okrController.updateKeyResult);
router.delete("/keyresults/:id", okrController.deleteKeyResult);

export default router;
