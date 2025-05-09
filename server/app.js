import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/auth.js";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import memberRoutes from "./routes/memberRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dosageFormRoutes from "./routes/dosageFormRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import expireRoutes from "./routes/expireRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import returnsRouter from "./routes/returns.js";
import expenseRoutes from "./routes/expenseRouter.js";
import okrRoutes from "./routes/okrRoutes.js";
import { notificationService } from "./controllers/notificationService.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/members", memberRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dosage-forms", dosageFormRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/expire", expireRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/returns", returnsRouter);
app.use("/api/expenses", expenseRoutes);
app.use("/api/okr", okrRoutes);

app.use(errorHandler);

export default app;
