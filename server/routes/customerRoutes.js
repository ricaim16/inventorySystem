import express from "express";
import { customerController } from "../controllers/customerController.js";
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

// Customer Routes
router.get(
  "/",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  customerController.getAllCustomers
);
router.get(
  "/:id",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  customerController.getCustomerById
);
router.post(
  "/",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  customerController.addCustomer
);
router.put(
  "/:id",
  roleMiddleware(["MANAGER"]),
  customerController.editCustomer
);
router.delete(
  "/:id",
  roleMiddleware(["MANAGER"]),
  customerController.deleteCustomer
);

// Customer Credit Routes
router.get(
  "/credits",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  customerController.getAllCustomerCredits
);
router.get(
  "/:customer_id/credits",
  roleMiddleware(["MANAGER", "EMPLOYEE"]),
  customerController.getCustomerCredits
);
router.get(
  "/credits/report",
  roleMiddleware(["MANAGER"]),
  customerController.generateCreditReport
);
router.post(
  "/credits",
  roleMiddleware(["MANAGER"]),
  logRawRequest,
  upload,
  customerController.addCustomerCredit
);
router.put(
  "/credits/:id",
  roleMiddleware(["MANAGER"]),
  upload,
  customerController.editCustomerCredit
);
router.delete(
  "/credits/:id",
  roleMiddleware(["MANAGER"]),
  customerController.deleteCustomerCredit
);

export default router;
