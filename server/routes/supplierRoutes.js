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
    const uploadPath = path.join(__dirname, "../Uploads");
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
  roleMiddleware(["MANAGER", "EMPLOYEE"]), // Both can view all suppliers
  supplierController.getAllSuppliers
);
router.get(
  "/:id",
  roleMiddleware(["MANAGER", "EMPLOYEE"]), // Both can view a specific supplier
  supplierController.getSupplierById
);
router.post(
  "/",
  roleMiddleware(["MANAGER", "EMPLOYEE"]), // Both can add suppliers
  supplierController.addSupplier
);
router.put(
  "/:id",
  roleMiddleware(["MANAGER", "EMPLOYEE"]), // Both can edit suppliers
  supplierController.editSupplier
);
router.delete(
  "/:id",
  roleMiddleware(["MANAGER"]), // Only MANAGER can delete suppliers
  supplierController.deleteSupplier
);

// Supplier Credit Routes
router.get(
  "/credits",
  roleMiddleware(["MANAGER", "EMPLOYEE"]), // Both can view all credits
  supplierController.getAllSupplierCredits
);
router.get(
  "/:supplier_id/credits",
  roleMiddleware(["MANAGER", "EMPLOYEE"]), // Both can view credits for a supplier
  supplierController.getSupplierCredits
);
router.get(
  "/credits/report",
  roleMiddleware(["MANAGER"]), // Only MANAGER can view credit report
  supplierController.generateCreditReport
);
router.post(
  "/credits",
  roleMiddleware(["MANAGER", "EMPLOYEE"]), 
  logRawRequest,
  upload,
  supplierController.addSupplierCredit
);
router.put(
  "/credits/:id",
  roleMiddleware(["MANAGER", "EMPLOYEE"]), // Both can edit credits
  upload,
  supplierController.editSupplierCredit
);
router.delete(
  "/credits/:id",
  roleMiddleware(["MANAGER" ,"EMPLOYEE"]), // Only MANAGER can delete credits
  supplierController.deleteSupplierCredit
);

export default router;
