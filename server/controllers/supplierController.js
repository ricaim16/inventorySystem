import prisma from "../config/db.js";
import path from "path";

function getEthiopianTime(date = new Date()) {
  const EAT_OFFSET = 3 * 60 * 60 * 1000;
  return new Date(date.getTime() + EAT_OFFSET);
}

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(
  __filename.startsWith("/") ? __filename.slice(1) : __filename
);

export const supplierController = {
  getAllSuppliers: async (req, res) => {
    try {
      const suppliers = await prisma.suppliers.findMany({
        select: {
          id: true,
          supplier_name: true,
          contact_info: true,
          location: true,
          email: true,
        }, // Include all fields needed by SupplierList
      });
      console.log(
        `Fetched ${suppliers.length} suppliers by user ${req.user.id}`
      );
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error.stack);
      res
        .status(500)
        .json({ message: "Error fetching suppliers", error: error.message });
    }
  },

  getSupplierById: async (req, res) => {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Valid supplier ID is required" });
    }
    try {
      const supplier = await prisma.suppliers.findUnique({
        where: { id },
        include: {
          SupplierCredits: {
            select: {
              credit_amount: true,
              payment_status: true,
              updated_at: true,
            },
          },
          Medicines: {
            select: { id: true, medicine_name: true, total_price: true },
          },
        },
      });
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      console.log(`Fetched supplier ${id} by user ${req.user.id}`);
      res.json(supplier);
    } catch (error) {
      console.error(`Error fetching supplier ${id}:`, error.stack);
      res
        .status(500)
        .json({ message: "Error fetching supplier", error: error.message });
    }
  },

  addSupplier: async (req, res) => {
    const {
      supplier_name,
      contact_info,
      payment_info_cbe,
      payment_info_coop,
      payment_info_boa,
      payment_info_awash,
      payment_info_ebirr,
      location,
      email,
    } = req.body;

    if (!supplier_name?.trim() || !contact_info?.trim() || !location?.trim()) {
      return res
        .status(400)
        .json({ message: "Name, contact info, and location are required" });
    }

    if (!/^\+?\d{9,13}$/.test(contact_info)) {
      return res.status(400).json({ message: "Invalid contact number format" });
    }

    try {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: supplier_name.trim(),
          contact_info: contact_info.trim(),
          payment_info_cbe: payment_info_cbe?.trim(),
          payment_info_coop: payment_info_coop?.trim(),
          payment_info_boa: payment_info_boa?.trim(),
          payment_info_awash: payment_info_awash?.trim(),
          payment_info_ebirr: payment_info_ebirr?.trim(),
          location: location.trim(),
          email: email?.trim(),
        },
      });
      console.log(`Created supplier by user ${req.user.id}:`, supplier);
      res
        .status(201)
        .json({ message: "Supplier created successfully", supplier });
    } catch (error) {
      console.error("Error adding supplier:", error.stack);
      res
        .status(500)
        .json({ message: "Error adding supplier", error: error.message });
    }
  },

  editSupplier: async (req, res) => {
    const { id } = req.params;
    const {
      supplier_name,
      contact_info,
      payment_info_cbe,
      payment_info_coop,
      payment_info_boa,
      payment_info_awash,
      payment_info_ebirr,
      location,
      email,
    } = req.body;

    try {
      const existingSupplier = await prisma.suppliers.findUnique({
        where: { id },
      });
      if (!existingSupplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      if (contact_info && !/^\+?\d{9,13}$/.test(contact_info)) {
        return res
          .status(400)
          .json({ message: "Invalid contact number format" });
      }

      const supplier = await prisma.suppliers.update({
        where: { id },
        data: {
          supplier_name:
            supplier_name?.trim() ?? existingSupplier.supplier_name,
          contact_info: contact_info?.trim() ?? existingSupplier.contact_info,
          payment_info_cbe:
            payment_info_cbe?.trim() ?? existingSupplier.payment_info_cbe,
          payment_info_coop:
            payment_info_coop?.trim() ?? existingSupplier.payment_info_coop,
          payment_info_boa:
            payment_info_boa?.trim() ?? existingSupplier.payment_info_boa,
          payment_info_awash:
            payment_info_awash?.trim() ?? existingSupplier.payment_info_awash,
          payment_info_ebirr:
            payment_info_ebirr?.trim() ?? existingSupplier.payment_info_ebirr,
          location: location?.trim() ?? existingSupplier.location,
          email: email?.trim() ?? existingSupplier.email,
        },
      });
      console.log(`Updated supplier ${id} by user ${req.user.id}:`, supplier);
      res
        .status(200)
        .json({ message: "Supplier updated successfully", supplier });
    } catch (error) {
      console.error(`Error updating supplier ${id}:`, error.stack);
      res
        .status(500)
        .json({ message: "Error updating supplier", error: error.message });
    }
  },

  deleteSupplier: async (req, res) => {
    const { id } = req.params;
    try {
      const supplier = await prisma.suppliers.findUnique({ where: { id } });
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const [supplierCredits, medicines] = await Promise.all([
        prisma.supplierCredits.count({ where: { supplier_id: id } }),
        prisma.medicines.count({ where: { supplier_id: id } }),
      ]);

      if (supplierCredits > 0 || medicines > 0) {
        return res.status(400).json({
          message:
            "Cannot delete supplier with associated credits or medicines",
        });
      }

      await prisma.suppliers.delete({ where: { id } });
      console.log(`Deleted supplier ${id} by user ${req.user.id}`);
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error(`Error deleting supplier ${id}:`, error.stack);
      res
        .status(500)
        .json({ message: "Error deleting supplier", error: error.message });
    }
  },

  // Keeping other credit-related methods unchanged as they are not directly related to the dropdown
  getAllSupplierCredits: async (req, res) => {
    try {
      const supplierCredits = await prisma.supplierCredits.findMany({
        include: {
          supplier: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });
      console.log(
        `Fetched ${supplierCredits.length} supplier credits by user ${req.user.id}`
      );
      res.json(supplierCredits);
    } catch (error) {
      console.error("Error fetching supplier credits:", error.stack);
      res.status(500).json({
        message: "Error fetching supplier credits",
        error: error.message,
      });
    }
  },

  getSupplierCredits: async (req, res) => {
    const { supplier_id } = req.params;
    try {
      const supplierCredits = await prisma.supplierCredits.findMany({
        where: { supplier_id },
        include: {
          supplier: { select: { supplier_name: true } },
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
        orderBy: { credit_date: "desc" },
      });

      if (!supplierCredits.length) {
        return res
          .status(404)
          .json({ message: "No credits found for this supplier" });
      }

      console.log(
        `Fetched ${supplierCredits.length} credits for supplier ${supplier_id} by user ${req.user.id}`
      );
      res.status(200).json({
        creditCount: supplierCredits.length,
        credits: supplierCredits,
      });
    } catch (error) {
      console.error(
        `Error fetching supplier credits for ${supplier_id}:`,
        error.stack
      );
      res.status(500).json({
        message: "Error fetching supplier credits",
        error: error.message,
      });
    }
  },

  addSupplierCredit: async (req, res) => {
    const {
      supplier_id,
      credit_amount,
      paid_amount = 0,
      medicine_name,
      payment_method = "NONE",
      description,
    } = req.body;
    const payment_file = req.file
      ? path.relative(__dirname, req.file.path).replace(/\\/g, "/")
      : null;

    if (!supplier_id?.trim() || !credit_amount?.toString().trim()) {
      return res
        .status(400)
        .json({ message: "Supplier ID and credit amount are required" });
    }

    if (
      req.file &&
      !["image/jpeg", "image/png", "application/pdf"].includes(
        req.file.mimetype
      )
    ) {
      return res
        .status(400)
        .json({ message: "Only JPEG, PNG, and PDF files are allowed" });
    }

    try {
      const supplier = await prisma.suppliers.findUnique({
        where: { id: supplier_id },
      });
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const parsedCreditAmount = parseFloat(credit_amount);
      const parsedPaidAmount = parseFloat(paid_amount || 0);

      if (
        isNaN(parsedCreditAmount) ||
        parsedCreditAmount <= 0 ||
        parsedPaidAmount < 0
      ) {
        return res
          .status(400)
          .json({ message: "Invalid credit or paid amount" });
      }

      const unpaid_amount = parsedCreditAmount - parsedPaidAmount;
      let payment_status;
      if (parsedPaidAmount === 0) payment_status = "UNPAID";
      else if (parsedPaidAmount < parsedCreditAmount)
        payment_status = "PARTIALLY_PAID";
      else payment_status = "PAID";

      const validPaymentMethods = [
        "NONE",
        "CASH",
        "CREDIT",
        "CBE",
        "COOP",
        "AWASH",
        "EBIRR",
      ];
      const finalPaymentMethod = validPaymentMethods.includes(payment_method)
        ? payment_method
        : "NONE";

      const currentETTime = getEthiopianTime();
      const supplierCredit = await prisma.supplierCredits.create({
        data: {
          supplier_id,
          credit_amount: parsedCreditAmount,
          paid_amount: parsedPaidAmount,
          unpaid_amount,
          total_unpaid_amount: unpaid_amount,
          total_paid_amount: parsedPaidAmount,
          medicine_name: medicine_name?.trim() || null,
          payment_method: finalPaymentMethod,
          description: description?.trim() || null,
          payment_status,
          credit_date: currentETTime,
          payment_file,
          created_by: req.user.id,
          updated_by: req.user.id,
          created_at: currentETTime,
          updated_at: currentETTime,
        },
        include: {
          supplier: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      console.log(
        `Created credit for supplier ${supplier_id} by user ${req.user.id}:`,
        supplierCredit
      );
      res.status(201).json({
        message: "Supplier credit created successfully",
        credit: supplierCredit,
      });
    } catch (error) {
      console.error("Error adding supplier credit:", error.stack);
      res.status(500).json({
        message: "Error adding supplier credit",
        error: error.message,
      });
    }
  },

  editSupplierCredit: async (req, res) => {
    const { id } = req.params;
    const {
      credit_amount,
      paid_amount,
      medicine_name,
      payment_method,
      description,
    } = req.body;
    const payment_file = req.file
      ? path.relative(__dirname, req.file.path).replace(/\\/g, "/")
      : undefined;

    try {
      const existingCredit = await prisma.supplierCredits.findUnique({
        where: { id },
      });
      if (!existingCredit) {
        return res.status(404).json({ message: "Supplier credit not found" });
      }

      const newCreditAmount =
        credit_amount !== undefined
          ? parseFloat(credit_amount)
          : existingCredit.credit_amount;
      const newPaidAmount =
        paid_amount !== undefined
          ? parseFloat(paid_amount)
          : existingCredit.paid_amount;

      if (isNaN(newCreditAmount) || newCreditAmount <= 0 || newPaidAmount < 0) {
        return res
          .status(400)
          .json({ message: "Invalid credit or paid amount" });
      }

      const unpaid_amount = newCreditAmount - newPaidAmount;
      let payment_status;
      if (newPaidAmount === 0) payment_status = "UNPAID";
      else if (newPaidAmount < newCreditAmount)
        payment_status = "PARTIALLY_PAID";
      else payment_status = "PAID";

      const validPaymentMethods = [
        "NONE",
        "CASH",
        "CREDIT",
        "CBE",
        "COOP",
        "AWASH",
        "EBIRR",
      ];
      const updatedPaymentMethod = payment_method
        ? validPaymentMethods.includes(payment_method)
          ? payment_method
          : "NONE"
        : existingCredit.payment_method;

      const currentETTime = getEthiopianTime();
      const updatedCredit = await prisma.supplierCredits.update({
        where: { id },
        data: {
          credit_amount: newCreditAmount,
          paid_amount: newPaidAmount,
          unpaid_amount,
          total_unpaid_amount: unpaid_amount,
          total_paid_amount: newPaidAmount,
          medicine_name: medicine_name?.trim() ?? existingCredit.medicine_name,
          payment_method: updatedPaymentMethod,
          description: description?.trim() ?? existingCredit.description,
          payment_status,
          payment_file:
            payment_file !== undefined
              ? payment_file
              : existingCredit.payment_file,
          updated_at: currentETTime,
          updated_by: req.user.id,
        },
        include: {
          supplier: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      console.log(
        `Updated credit ${id} by user ${req.user.id}:`,
        updatedCredit
      );
      res.status(200).json({
        message: "Supplier credit updated successfully",
        credit: updatedCredit,
      });
    } catch (error) {
      console.error(`Error updating supplier credit ${id}:`, error.stack);
      res.status(500).json({
        message: "Error updating supplier credit",
        error: error.message,
      });
    }
  },

  deleteSupplierCredit: async (req, res) => {
    const { id } = req.params;
    try {
      const supplierCredit = await prisma.supplierCredits.findUnique({
        where: { id },
      });
      if (!supplierCredit) {
        return res.status(404).json({ message: "Supplier credit not found" });
      }

      await prisma.supplierCredits.delete({ where: { id } });
      console.log(`Deleted credit ${id} by user ${req.user.id}`);
      res.json({ message: "Supplier credit deleted successfully" });
    } catch (error) {
      console.error(`Error deleting supplier credit ${id}:`, error.stack);
      res.status(500).json({
        message: "Error deleting supplier credit",
        error: error.message,
      });
    }
  },

  generateCreditReport: async (req, res) => {
    const {
      start_date,
      end_date,
      supplier_id,
      limit = 100,
      offset = 0,
    } = req.query;
    try {
      const filters = { AND: [] };
      if (supplier_id) filters.supplier_id = supplier_id;
      if (start_date || end_date) {
        filters.credit_date = {};
        if (start_date) filters.credit_date.gte = new Date(start_date);
        if (end_date) filters.credit_date.lte = new Date(end_date);
      }

      const [credits, totalCount] = await Promise.all([
        prisma.supplierCredits.findMany({
          where: filters,
          include: {
            supplier: { select: { supplier_name: true } },
            createdBy: { select: { username: true } },
            updatedBy: { select: { username: true } },
          },
          orderBy: { credit_date: "desc" },
          take: Math.min(parseInt(limit), 1000),
          skip: parseInt(offset),
        }),
        prisma.supplierCredits.count({ where: filters }),
      ]);

      const totalCredits = credits.reduce(
        (sum, credit) => sum + credit.credit_amount,
        0
      );
      const totalPaid = credits.reduce(
        (sum, credit) => sum + credit.paid_amount,
        0
      );
      const totalUnpaid = credits.reduce(
        (sum, credit) => sum + credit.unpaid_amount,
        0
      );

      console.log(
        `Generated report with ${credits.length} supplier credits by user ${req.user.id}`
      );
      res.status(200).json({
        summary: {
          creditCount: credits.length,
          totalCredits,
          totalPaid,
          totalUnpaid,
          totalRecords: totalCount,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(totalCount / limit),
        },
        credits,
      });
    } catch (error) {
      console.error("Error generating supplier credit report:", error.stack);
      res.status(500).json({
        message: "Error generating supplier credit report",
        error: error.message,
      });
    }
  },
};

export default supplierController;
