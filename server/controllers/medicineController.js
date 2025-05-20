import prisma from "../config/db.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../Uploads");

function getEthiopianTime(date = new Date()) {
  const utcDate = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
  const etOffset = 3 * 60 * 60 * 1000; // UTC+3 for East Africa Time
  return new Date(utcDate.getTime() + etOffset);
}

export const medicineController = {
  getAllMedicines: async (req, res) => {
    try {
      const medicines = await prisma.medicines.findMany({
        include: {
          category: true,
          dosage_form: true,
          supplier: true,
          Sales: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      const transformedMedicines = medicines.map((medicine) => ({
        ...medicine,
        Payment_file: medicine.Payment_file
          ? `${req.protocol}://${req.get("host")}/${medicine.Payment_file}`
          : null,
      }));

      res.json(transformedMedicines);
    } catch (error) {
      console.error("Error fetching medicines:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: { message: "Error fetching medicines", details: error.message },
      });
    }
  },

  getMedicineById: async (req, res) => {
    const { id } = req.params;
    try {
      const medicine = await prisma.medicines.findUnique({
        where: { id },
        include: {
          category: true,
          dosage_form: true,
          supplier: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });
      if (!medicine)
        return res
          .status(404)
          .json({ error: { message: "Medicine not found" } });

      const transformedMedicine = {
        ...medicine,
        Payment_file: medicine.Payment_file
          ? `${req.protocol}://${req.get("host")}/${medicine.Payment_file}`
          : null,
      };

      res.json(transformedMedicine);
    } catch (error) {
      console.error(`Error fetching medicine ${id}:`, {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: { message: "Error fetching medicine", details: error.message },
      });
    }
  },

  addMedicine: async (req, res) => {
    const {
      medicine_name,
      brand_name,
      batch_number,
      category_id,
      dosage_form_id,
      medicine_weight,
      quantity,
      supplier_id,
      unit_price,
      sell_price,
      expire_date,
      required_prescription,
      payment_method,
      details,
      invoice_number,
    } = req.body;

    const payment_file = req.file
      ? path.join("Uploads", req.file.filename).replace(/\\/g, "/")
      : null;

    try {
      // Validate required fields
      const requiredFields = {
        medicine_name,
        supplier_id,
        unit_price,
        sell_price,
        quantity,
        category_id,
        dosage_form_id,
        expire_date,
      };
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: {
            message: "Required fields are missing",
            details: missingFields.reduce(
              (acc, field) => ({
                ...acc,
                [field]: `${field.replace("_", " ")} is required`,
              }),
              {}
            ),
          },
        });
      }

      // Validate user
      if (!req.user?.id) {
        return res
          .status(401)
          .json({ error: { message: "Unauthorized: User not authenticated" } });
      }

      const normalizedBatchNumber =
        batch_number && batch_number.trim()
          ? batch_number.trim().toUpperCase()
          : null;

      // Validate batch number uniqueness
      if (normalizedBatchNumber) {
        const existingBatch = await prisma.medicines.findFirst({
          where: { batch_number: normalizedBatchNumber },
        });
        if (existingBatch) {
          return res.status(409).json({
            error: {
              message: "Batch number already exists",
              details: { batch_number: "Batch number must be unique" },
            },
          });
        }
      }

      // Parse and validate inputs
      const parsedSupplierId = supplier_id?.toString();
      const parsedCategoryId = category_id?.toString();
      const parsedDosageFormId = dosage_form_id?.toString();
      const parsedQuantity = parseInt(quantity, 10);
      const parsedUnitPrice = parseFloat(unit_price);
      const parsedSellPrice = parseFloat(sell_price);
      const parsedMedicineWeight = medicine_weight
        ? parseFloat(medicine_weight)
        : null;
      const parsedExpireDate = new Date(expire_date);
      const parsedRequiredPrescription =
        required_prescription === "true" || required_prescription === true;

      // Validate numeric and date values
      const validationErrors = {};
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        validationErrors.quantity =
          "Quantity must be a valid non-negative number";
      }
      if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
        validationErrors.unit_price =
          "Unit price must be a valid non-negative number";
      }
      if (isNaN(parsedSellPrice) || parsedSellPrice < 0) {
        validationErrors.sell_price =
          "Sell price must be a valid non-negative number";
      }
      if (
        parsedMedicineWeight !== null &&
        (isNaN(parsedMedicineWeight) || parsedMedicineWeight < 0)
      ) {
        validationErrors.medicine_weight =
          "Medicine weight must be a valid non-negative number";
      }
      if (isNaN(parsedExpireDate.getTime())) {
        validationErrors.expire_date = "Expire date must be a valid date";
      }
      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
          error: { message: "Invalid input values", details: validationErrors },
        });
      }

      // Validate sell price vs unit price
      if (parsedSellPrice < parsedUnitPrice) {
        return res.status(400).json({
          error: {
            message: "Sell price must be equal to or greater than unit price",
          },
        });
      }

      // Validate foreign keys
      const [supplier, category, dosageForm, user] = await Promise.all([
        parsedSupplierId
          ? prisma.suppliers.findUnique({ where: { id: parsedSupplierId } })
          : null,
        parsedCategoryId
          ? prisma.categories.findUnique({ where: { id: parsedCategoryId } })
          : null,
        parsedDosageFormId
          ? prisma.dosageForms.findUnique({ where: { id: parsedDosageFormId } })
          : null,
        prisma.users.findUnique({ where: { id: req.user.id } }),
      ]);

      if (!supplier && parsedSupplierId) {
        return res
          .status(404)
          .json({ error: { message: "Supplier not found" } });
      }
      if (!category && parsedCategoryId) {
        return res
          .status(404)
          .json({ error: { message: "Category not found" } });
      }
      if (!dosageForm && parsedDosageFormId) {
        return res
          .status(404)
          .json({ error: { message: "Dosage form not found" } });
      }
      if (!user) {
        return res.status(401).json({ error: { message: "User not found" } });
      }

      // Validate file type
      if (
        payment_file &&
        req.file &&
        !["image/jpeg", "image/png", "application/pdf"].includes(
          req.file.mimetype
        )
      ) {
        return res.status(400).json({
          error: {
            message: "Invalid file type. Only JPEG, PNG, or PDF allowed",
          },
        });
      }

      const total_price = parsedUnitPrice * parsedQuantity;

      const medicine = await prisma.medicines.create({
        data: {
          medicine_name,
          brand_name: brand_name || null,
          batch_number: normalizedBatchNumber,
          quantity: parsedQuantity,
          initial_quantity: parsedQuantity,
          supplier: parsedSupplierId
            ? { connect: { id: parsedSupplierId } }
            : undefined,
          invoice_number: invoice_number || null,
          unit_price: parsedUnitPrice,
          sell_price: parsedSellPrice,
          total_price,
          expire_date: parsedExpireDate,
          required_prescription: parsedRequiredPrescription,
          payment_method: payment_method || "NONE",
          Payment_file: payment_file,
          details: details || null,
          category: parsedCategoryId
            ? { connect: { id: parsedCategoryId } }
            : undefined,
          dosage_form: parsedDosageFormId
            ? { connect: { id: parsedDosageFormId } }
            : undefined,
          medicine_weight: parsedMedicineWeight,
          createdBy: { connect: { id: req.user.id } },
          updatedBy: { connect: { id: req.user.id } },
        },
        include: {
          category: true,
          dosage_form: true,
          supplier: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      const transformedMedicine = {
        ...medicine,
        Payment_file: medicine.Payment_file
          ? `${req.protocol}://${req.get("host")}/${medicine.Payment_file}`
          : null,
      };

      res.status(201).json({
        message: "Medicine added successfully",
        medicine: transformedMedicine,
      });
    } catch (error) {
      console.error("Error adding medicine:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
        meta: error.meta,
      });
      if (error.code === "P2002") {
        return res.status(409).json({
          error: {
            message: "A medicine with this batch number already exists",
            details: { batch_number: "Batch number must be unique" },
          },
        });
      }
      if (error.code === "P2003") {
        return res.status(400).json({
          error: {
            message: "Invalid foreign key reference",
            details: error.message,
            meta: error.meta,
          },
        });
      }
      res.status(500).json({
        error: {
          message: "Error adding medicine",
          details: error.message || "Unexpected error occurred",
          meta: error.meta,
        },
      });
    }
  },

  editMedicine: async (req, res) => {
    const { id } = req.params;
    const {
      medicine_name,
      brand_name,
      batch_number,
      category_id,
      dosage_form_id,
      medicine_weight,
      quantity,
      supplier_id,
      unit_price,
      sell_price,
      expire_date,
      required_prescription,
      payment_method,
      details,
      invoice_number,
      Payment_file, // Note: FormData may send this as a string or file
    } = req.body;

    const payment_file = req.file
      ? path.join("Uploads", req.file.filename).replace(/\\/g, "/")
      : Payment_file === "" || Payment_file === undefined
      ? undefined // Explicitly handle empty string or undefined
      : Payment_file;

    try {
      // Log incoming data for debugging
      console.log("Updating medicine:", {
        id,
        body: req.body,
        file: req.file ? req.file.filename : null,
        userId: req.user?.id,
      });

      // Validate authentication
      if (!req.user?.id) {
        return res.status(401).json({
          error: { message: "Unauthorized: User not authenticated" },
        });
      }

      // Check if medicine exists
      const existingMedicine = await prisma.medicines.findUnique({
        where: { id },
      });
      if (!existingMedicine) {
        return res.status(404).json({
          error: { message: "Medicine not found" },
        });
      }

      // Validate user
      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
      });
      if (!user) {
        return res.status(401).json({
          error: { message: "User not found" },
        });
      }

      // Normalize batch number
      const normalizedBatchNumber =
        batch_number && batch_number.trim()
          ? batch_number.trim().toUpperCase()
          : undefined;

      // Check batch number uniqueness (only if changed)
      if (
        normalizedBatchNumber &&
        normalizedBatchNumber !== existingMedicine.batch_number
      ) {
        const existingBatch = await prisma.medicines.findFirst({
          where: { batch_number: normalizedBatchNumber },
        });
        if (existingBatch) {
          return res.status(409).json({
            error: {
              message: "Batch number already exists",
              details: { batch_number: "Batch number must be unique" },
            },
          });
        }
      }

      // Parse inputs with default fallbacks
      const parsedSupplierId = supplier_id ? supplier_id.toString() : undefined;
      const parsedCategoryId = category_id ? category_id.toString() : undefined;
      const parsedDosageFormId = dosage_form_id
        ? dosage_form_id.toString()
        : undefined;
      const parsedQuantity =
        quantity !== undefined && quantity !== ""
          ? parseInt(quantity, 10)
          : undefined;
      const parsedUnitPrice =
        unit_price !== undefined && unit_price !== ""
          ? parseFloat(unit_price)
          : undefined;
      const parsedSellPrice =
        sell_price !== undefined && sell_price !== ""
          ? parseFloat(sell_price)
          : undefined;
      const parsedMedicineWeight =
        medicine_weight !== undefined && medicine_weight !== ""
          ? parseFloat(medicine_weight)
          : undefined;
      const parsedExpireDate =
        expire_date && expire_date !== "" ? new Date(expire_date) : undefined;
      const parsedRequiredPrescription =
        required_prescription !== undefined
          ? required_prescription === "true" || required_prescription === true
          : undefined;

      // Validate inputs
      const validationErrors = {};
      if (
        parsedQuantity !== undefined &&
        (isNaN(parsedQuantity) || parsedQuantity < 0)
      ) {
        validationErrors.quantity =
          "Quantity must be a valid non-negative integer";
      }
      if (
        parsedUnitPrice !== undefined &&
        (isNaN(parsedUnitPrice) || parsedUnitPrice < 0)
      ) {
        validationErrors.unit_price =
          "Unit price must be a valid non-negative number";
      }
      if (
        parsedSellPrice !== undefined &&
        (isNaN(parsedSellPrice) || parsedSellPrice < 0)
      ) {
        validationErrors.sell_price =
          "Sell price must be a valid non-negative number";
      }
      if (
        parsedMedicineWeight !== undefined &&
        (isNaN(parsedMedicineWeight) || parsedMedicineWeight < 0)
      ) {
        validationErrors.medicine_weight =
          "Medicine weight must be a valid non-negative number";
      }
      if (
        parsedExpireDate !== undefined &&
        isNaN(parsedExpireDate?.getTime())
      ) {
        validationErrors.expire_date = "Expire date must be a valid date";
      }
      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
          error: { message: "Invalid input values", details: validationErrors },
        });
      }

      // Validate sell price vs unit price
      if (
        parsedUnitPrice !== undefined &&
        parsedSellPrice !== undefined &&
        parsedSellPrice < parsedUnitPrice
      ) {
        return res.status(400).json({
          error: {
            message: "Sell price must be equal to or greater than unit price",
          },
        });
      }

      // Validate foreign keys
      const [supplier, category, dosageForm] = await Promise.all([
        parsedSupplierId
          ? prisma.suppliers.findUnique({ where: { id: parsedSupplierId } })
          : Promise.resolve(null),
        parsedCategoryId
          ? prisma.categories.findUnique({ where: { id: parsedCategoryId } })
          : Promise.resolve(null),
        parsedDosageFormId
          ? prisma.dosageForms.findUnique({ where: { id: parsedDosageFormId } })
          : Promise.resolve(null),
      ]);

      if (parsedSupplierId && !supplier) {
        return res.status(404).json({
          error: { message: "Supplier not found" },
        });
      }
      if (parsedCategoryId && !category) {
        return res.status(404).json({
          error: { message: "Category not found" },
        });
      }
      if (parsedDosageFormId && !dosageForm) {
        return res.status(404).json({
          error: { message: "Dosage form not found" },
        });
      }

      // Validate file type
      if (
        payment_file &&
        req.file &&
        !["image/jpeg", "image/png", "application/pdf"].includes(
          req.file.mimetype
        )
      ) {
        return res.status(400).json({
          error: {
            message: "Invalid file type. Only JPEG, PNG, or PDF allowed",
          },
        });
      }

      // Calculate total_price
      const updatedUnitPrice = parsedUnitPrice ?? existingMedicine.unit_price;
      const updatedQuantity = parsedQuantity ?? existingMedicine.quantity;
      const total_price = updatedUnitPrice * updatedQuantity;

      // Prepare update data
      const updateData = {
        medicine_name: medicine_name ?? existingMedicine.medicine_name,
        brand_name:
          brand_name !== undefined
            ? brand_name || null
            : existingMedicine.brand_name,
        batch_number: normalizedBatchNumber ?? existingMedicine.batch_number,
        category: parsedCategoryId
          ? { connect: { id: parsedCategoryId } }
          : undefined,
        dosage_form: parsedDosageFormId
          ? { connect: { id: parsedDosageFormId } }
          : undefined,
        medicine_weight:
          parsedMedicineWeight ?? existingMedicine.medicine_weight,
        quantity: updatedQuantity,
        initial_quantity: updatedQuantity ?? existingMedicine.initial_quantity,
        supplier: parsedSupplierId
          ? { connect: { id: parsedSupplierId } }
          : undefined,
        invoice_number:
          invoice_number !== undefined
            ? invoice_number || null
            : existingMedicine.invoice_number,
        unit_price: updatedUnitPrice,
        sell_price: parsedSellPrice ?? existingMedicine.sell_price,
        total_price,
        expire_date: parsedExpireDate ?? existingMedicine.expire_date,
        required_prescription:
          parsedRequiredPrescription ?? existingMedicine.required_prescription,
        payment_method: payment_method ?? existingMedicine.payment_method,
        Payment_file: payment_file ?? existingMedicine.Payment_file,
        details:
          details !== undefined ? details || null : existingMedicine.details,
        updatedBy: req.user.id ? { connect: { id: req.user.id } } : undefined,
        // Do not set updatedAt explicitly; let Prisma handle it
      };

      // Remove undefined fields to avoid Prisma issues
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Update medicine
      const medicine = await prisma.medicines.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          dosage_form: true,
          supplier: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      // Transform Payment_file URL
      const transformedMedicine = {
        ...medicine,
        Payment_file: medicine.Payment_file
          ? `${req.protocol}://${req.get("host")}/${medicine.Payment_file}`
          : null,
      };

      res.status(200).json({
        message: "Medicine updated successfully",
        medicine: transformedMedicine,
      });
    } catch (error) {
      console.error(`Error updating medicine ${id}:`, {
        message: error.message,
        code: error.code,
        stack: error.stack,
        meta: error.meta,
        body: req.body,
        file: req.file ? req.file.filename : null,
      });
      if (error.code === "P2002") {
        return res.status(409).json({
          error: {
            message: "A medicine with this batch number already exists",
            details: { batch_number: "Batch number must be unique" },
          },
        });
      }
      if (error.code === "P2003") {
        return res.status(400).json({
          error: {
            message: "Invalid foreign key reference",
            details: error.message,
            meta: error.meta,
          },
        });
      }
      res.status(500).json({
        error: {
          message: "Error updating medicine",
          details: error.message || "Unexpected error occurred",
          meta: error.meta,
        },
      });
    }
  },
  
  deleteMedicine: async (req, res) => {
    const { id } = req.params;
    try {
      if (!id) {
        return res
          .status(400)
          .json({ error: { message: "Medicine ID is required" } });
      }

      const medicine = await prisma.medicines.findUnique({ where: { id } });
      if (!medicine) {
        return res
          .status(404)
          .json({ error: { message: "Medicine not found" } });
      }

      await prisma.$transaction(async (tx) => {
        await tx.sales.deleteMany({ where: { medicine_id: id } });
        await tx.returns.deleteMany({ where: { medicine_id: id } });
        await tx.medicines.delete({ where: { id } });
      });

      res.json({ message: "Medicine deleted successfully" });
    } catch (error) {
      console.error(`Error deleting medicine ${id}:`, {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      res.status(500).json({
        error: {
          message: "Error deleting medicine",
          details: error.message || "Unexpected error occurred",
        },
      });
    }
  },

  getLowStockMedicines: async (req, res) => {
    const LOW_STOCK_THRESHOLD = 10;
    try {
      const lowStockMedicines = await prisma.medicines.findMany({
        where: { quantity: { lte: LOW_STOCK_THRESHOLD } },
        include: { category: true, dosage_form: true, supplier: true },
      });

      const transformedLowStockMedicines = lowStockMedicines.map(
        (medicine) => ({
          ...medicine,
          Payment_file: medicine.Payment_file
            ? `${req.protocol}://${req.get("host")}/${medicine.Payment_file}`
            : null,
        })
      );

      res.json(transformedLowStockMedicines);
    } catch (error) {
      console.error("Error fetching low stock medicines:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      res.status(500).json({
        error: {
          message: "Error fetching low stock medicines",
          details: error.message || "Unexpected error occurred",
        },
      });
    }
  },

  getExpirationAlerts: async (req, res) => {
    try {
      const today = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(today.getDate() + 30); // Alert for medicines expiring within 30 days

      const expiringMedicines = await prisma.medicines.findMany({
        where: {
          expire_date: {
            gte: today,
            lte: thresholdDate,
          },
        },
        include: {
          category: true,
          dosage_form: true,
          supplier: true,
          createdBy: { select: { username: true } },
        },
      });

      const transformedExpiringMedicines = expiringMedicines.map(
        (medicine) => ({
          ...medicine,
          Payment_file: medicine.Payment_file
            ? `${req.protocol}://${req.get("host")}/${medicine.Payment_file}`
            : null,
        })
      );

      res.json(transformedExpiringMedicines);
    } catch (error) {
      console.error("Error fetching expiration alerts:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      res.status(500).json({
        error: {
          message: "Error fetching expiration alerts",
          details: error.message || "Unexpected error occurred",
        },
      });
    }
  },

  getExpiredMedicines: async (req, res) => {
    try {
      const today = new Date();

      const expiredMedicines = await prisma.medicines.findMany({
        where: {
          expire_date: {
            lt: today,
          },
        },
        include: {
          category: true,
          dosage_form: true,
          supplier: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      const transformedExpiredMedicines = expiredMedicines.map((medicine) => ({
        ...medicine,
        Payment_file: medicine.Payment_file
          ? `${req.protocol}://${req.get("host")}/${medicine.Payment_file}`
          : null,
      }));

      res.json({ medicines: transformedExpiredMedicines });
    } catch (error) {
      console.error("Error fetching expired medicines:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      res.status(500).json({
        error: {
          message: "Error fetching expired medicines",
          details: error.message || "Unexpected error occurred",
        },
      });
    }
  },

  generateMedicineReport: async (req, res) => {
    try {
      const medicines = await prisma.medicines.findMany({
        include: {
          Sales: true,
          category: true,
          dosage_form: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      if (!medicines.length) {
        return res.json({
          generatedAt: getEthiopianTime(),
          winningProducts: [],
          worstPerformingProducts: [],
          stockLevels: [],
          categoryDistribution: [],
          totalStockLevel: 0,
          totalAssetValue: 0,
          stockLevelChange: 0,
          assetValueChange: 0,
          stockLevelChangeMessage: "No medicines available",
          assetValueChangeMessage: "No medicines available",
        });
      }

      const transformedMedicines = medicines.map((medicine) => ({
        ...medicine,
        Payment_file: medicine.Payment_file
          ? `${req.protocol}://${req.get("host")}/${medicine.Payment_file}`
          : null,
      }));

      const medicineSales = transformedMedicines.map((med) => {
        const totalSales = med.Sales.reduce(
          (sum, sale) => sum + sale.quantity,
          0
        );
        // Calculate turnover ratio as totalSales / initial_quantity
        const turnoverRatio =
          med.initial_quantity === 0
            ? totalSales > 0
              ? Infinity
              : 0
            : totalSales / med.initial_quantity;
        return { ...med, totalSales, turnoverRatio };
      });

      const totalOverallSales = medicineSales.reduce(
        (sum, med) => sum + med.totalSales,
        0
      );

      const medicineSalesWithPercent = medicineSales.map((med) => ({
        ...med,
        salesPercent:
          totalOverallSales > 0
            ? (med.totalSales / totalOverallSales) * 100
            : 0,
      }));

      const sortedBySales = [...medicineSalesWithPercent].sort(
        (a, b) => b.salesPercent - a.salesPercent
      );

      const winningProducts = sortedBySales
        .slice(0, Math.min(5, sortedBySales.length))
        .map((med) => ({
          id: med.id,
          medicine_name: med.medicine_name,
          totalSales: med.totalSales,
          salesPercent: med.salesPercent.toFixed(2),
          unit_price: med.unit_price,
          dosage_form: med.dosage_form,
          category: med.category,
        }));

      const sortedByTurnover = [...medicineSalesWithPercent]
        .filter((med) => med.totalSales > 0 || med.quantity > 0)
        .sort((a, b) => a.turnoverRatio - b.turnoverRatio);

      const worstPerformingProducts = sortedByTurnover
        .slice(0, Math.min(5, sortedByTurnover.length))
        .map((med) => ({
          id: med.id,
          medicine_name: med.medicine_name,
          totalSales: med.totalSales,
          turnoverRatio: isFinite(med.turnoverRatio)
            ? Number(med.turnoverRatio.toFixed(2))
            : "Infinity",
          quantityInStock: med.quantity,
          unit_price: med.unit_price,
          dosage_form: med.dosage_form,
          category: med.category,
        }));

      const stockLevels = transformedMedicines.map((med) => ({
        id: med.id,
        medicine_name: med.medicine_name,
        quantity: med.quantity,
        unit_price: med.unit_price,
        expire_date: med.expire_date,
        createdBy: med.createdBy.username,
        updatedBy: med.updatedBy?.username || null,
      }));

      const totalStockLevel = transformedMedicines.reduce(
        (sum, med) => sum + med.quantity,
        0
      );

      const totalAssetValue = transformedMedicines.reduce(
        (sum, med) => sum + (med.quantity * med.unit_price || 0),
        0
      );

      const categoryCounts = transformedMedicines.reduce((acc, med) => {
        const categoryName = med.category?.name || "Uncategorized";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      const categoryDistribution = Object.entries(categoryCounts).map(
        ([name, count]) => ({
          category_name: name,
          count,
          percent: ((count / transformedMedicines.length) * 100).toFixed(2),
        })
      );

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentMedicines = await prisma.medicines.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { quantity: true, unit_price: true },
      });

      const recentStockLevel = recentMedicines.reduce(
        (sum, med) => sum + med.quantity,
        0
      );
      const recentAssetValue = recentMedicines.reduce(
        (sum, med) => sum + (med.quantity * med.unit_price || 0),
        0
      );

      const stockLevelChange =
        totalStockLevel > 0 ? (recentStockLevel / totalStockLevel) * 100 : 0;
      const assetValueChange =
        totalAssetValue > 0 ? (recentAssetValue / totalAssetValue) * 100 : 0;

      const report = {
        generatedAt: getEthiopianTime(),
        winningProducts,
        worstPerformingProducts,
        stockLevels,
        categoryDistribution,
        totalStockLevel,
        totalAssetValue,
        stockLevelChange: stockLevelChange.toFixed(2),
        assetValueChange: assetValueChange.toFixed(2),
        stockLevelChangeMessage:
          recentStockLevel === 0
            ? "No medicines added in the last 7 days"
            : `${stockLevelChange.toFixed(
                2
              )}% of current stock was added in the last 7 days`,
        assetValueChangeMessage:
          recentAssetValue === 0
            ? "No medicines added in the last 7 days"
            : `${assetValueChange.toFixed(
                2
              )}% of current asset value was added in the last 7 days`,
      };

      res.json(report);
    } catch (error) {
      console.error("Error generating medicine report:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      res.status(500).json({
        error: {
          message: "Error generating report",
          details: error.message || "Unexpected error occurred",
        },
      });
    }
  },

  getMedicineByBatchNumber: async (req, res) => {
    const { batchNumber } = req.params;
    console.log(`Received batchNumber: ${batchNumber}`);
    try {
      const searchTerm = batchNumber.trim();
      console.log(`Search term: ${searchTerm}`);
      const medicines = await prisma.medicines.findMany({
        where: {
          batch_number: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          medicine_name: true,
          sell_price: true,
          quantity: true,
          dosage_form_id: true,
          required_prescription: true,
          batch_number: true,
        },
      });
      if (!medicines || medicines.length === 0) {
        console.log(
          `No medicines found for batch number containing ${searchTerm}`
        );
        return res.status(404).json({ message: "No medicines found" });
      }
      console.log(
        `Fetched medicines for batch number containing ${searchTerm}:`,
        medicines
      );
      res.json(medicines);
    } catch (error) {
      console.error(
        `Error fetching medicines with batch number ${batchNumber}:`,
        {
          message: error.message,
          stack: error.stack,
        }
      );
      res.status(500).json({
        message: "Error fetching medicines",
        error: error.message,
      });
    }
  },

  getMedicineByBatchNumber: async (req, res) => {
    const { batchNumber } = req.params;
    console.log(`Received batchNumber: ${batchNumber}`);
    try {
      const searchTerm = batchNumber.trim();
      console.log(`Search term: ${searchTerm}`);
      const medicines = await prisma.medicines.findMany({
        where: {
          batch_number: {
            contains: searchTerm,
            mode: "insensitive", // Case-insensitive search
          },
        },
        select: {
          id: true,
          medicine_name: true,
          sell_price: true,
          quantity: true,
          dosage_form_id: true,
          required_prescription: true,
          batch_number: true, // Include batch number in the response
        },
      });
      if (!medicines || medicines.length === 0) {
        console.log(
          `No medicines found for batch number containing ${searchTerm}`
        );
        return res.status(404).json({ message: "No medicines found" });
      }
      console.log(
        `Fetched medicines for batch number containing ${searchTerm}:`,
        medicines
      );
      res.json(medicines); // Return an array of matching medicines
    } catch (error) {
      console.error(
        `Error fetching medicines with batch number ${batchNumber}:`,
        {
          message: error.message,
          stack: error.stack,
        }
      );
      res.status(500).json({
        message: "Error fetching medicines",
        error: error.message,
      });
    }
  },
};
