import express from "express";
import { medicineController } from "../controllers/medicineController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      !["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype)
    ) {
      return cb(new Error("Only JPEG, PNG, and PDF files are allowed"));
    }
    cb(null, true);
  },
});

// Routes
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  medicineController.getAllMedicines
);

router.get(
  "/low-stock",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  medicineController.getLowStockMedicines
);

router.get(
  "/report",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  medicineController.generateMedicineReport
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  medicineController.getMedicineById
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  upload.single("Payment_file"),
  medicineController.addMedicine
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  upload.single("Payment_file"),
  medicineController.editMedicine
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  medicineController.deleteMedicine
);

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ error: { message: "File upload error", details: err.message } });
  }
  next(err);
});


export default router;
