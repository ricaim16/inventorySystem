// routers/supplierRoutes.js
import express from "express";
import { supplierController } from "../controllers/supplierController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(
  __filename.startsWith("/") ? __filename.slice(1) : __filename
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single("payment_file");

const logRawRequest = (req, res, next) => {
  console.log("Raw request headers:", req.headers);
  console.log("Raw request body (before multer):", req.body);
  next();
};

const router = express.Router();

router.use(authMiddleware);

// Supplier Routes
router.get(
  "/",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  supplierController.getAllSuppliers
);
router.get(
  "/:id",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  supplierController.getSupplierById
);
router.post(
  "/",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  supplierController.addSupplier
);
router.put(
  "/:id",
  roleMiddleware(["MANAGER"]),
  supplierController.editSupplier
);
router.delete(
  "/:id",
  roleMiddleware(["MANAGER"]),
  supplierController.deleteSupplier
);

// Supplier Credit Routes
router.get(
  "/credits",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  supplierController.getAllSupplierCredits
);
router.get(
  "/:supplier_id/credits",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  supplierController.getSupplierCredits
);
router.get(
  "/credits/report",
  roleMiddleware(["MANAGER"]),
  supplierController.generateCreditReport
);
router.post(
  "/credits",
  roleMiddleware(["MANAGER"]),
  logRawRequest,
  upload,
  supplierController.addSupplierCredit
);
router.put(
  "/credits/:id",
  roleMiddleware(["MANAGER"]),
  upload,
  supplierController.editSupplierCredit
);
router.delete(
  "/credits/:id",
  roleMiddleware(["MANAGER"]),
  supplierController.deleteSupplierCredit
);

export default router;
