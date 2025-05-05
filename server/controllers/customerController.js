import prisma from "../config/db.js";
import path from "path";

function getEthiopianTime(date = new Date()) {
  const EAT_OFFSET = 3 * 60 * 60 * 1000; // Ethiopia UTC+3 year-round
  return new Date(date.getTime() + EAT_OFFSET);
}

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(
  __filename.startsWith("/") ? __filename.slice(1) : __filename
);

export const customerController = {
  getAllCustomers: async (req, res) => {
    try {
      const customers = await prisma.customers.findMany({
        include: {
          Sales: {
            select: { id: true, total_amount: true, sealed_date: true },
          },
          CustomerCredit: {
            select: { credit_amount: true, status: true, updated_at: true },
          },
        },
      });
      console.log(
        `Fetched ${customers.length} customers by user ${req.user.id}`
      );
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error.stack);
      res
        .status(500)
        .json({ message: "Error fetching customers", error: error.message });
    }
  },

  getCustomerById: async (req, res) => {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Valid customer ID is required" });
    }

    try {
      const customer = await prisma.customers.findUnique({
        where: { id },
        include: {
          Sales: {
            select: { id: true, total_amount: true, sealed_date: true },
          },
          CustomerCredit: {
            select: { credit_amount: true, status: true, updated_at: true },
          },
        },
      });
      if (!customer) {
        console.log(`Customer ID ${id} not found for user ${req.user.id}`);
        return res.status(404).json({ message: "Customer not found" });
      }
      console.log(`Fetched customer ${id} by user ${req.user.id}`);
      res.json(customer);
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error.stack);
      res
        .status(500)
        .json({ message: "Error fetching customer", error: error.message });
    }
  },

  addCustomer: async (req, res) => {
    const { name, phone, address, status } = req.body;

    if (!name?.trim() || !phone?.trim() || !address?.trim()) {
      return res
        .status(400)
        .json({ message: "Name, phone, and address are required" });
    }

    if (!/^\+?\d{9,13}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    try {
      const customer = await prisma.customers.create({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          status: status?.toUpperCase() || "ACTIVE",
        },
      });
      console.log(`Created customer by user ${req.user.id}:`, customer);
      res
        .status(201)
        .json({ message: "Customer created successfully", customer });
    } catch (error) {
      console.error("Error adding customer:", error.stack);
      res
        .status(500)
        .json({ message: "Error adding customer", error: error.message });
    }
  },

  editCustomer: async (req, res) => {
    const { id } = req.params;
    const { name, phone, address, status } = req.body;

    try {
      const existingCustomer = await prisma.customers.findUnique({
        where: { id },
      });
      if (!existingCustomer) {
        console.log(`Customer ID ${id} not found for user ${req.user.id}`);
        return res.status(404).json({ message: "Customer not found" });
      }

      if (phone && !/^\+?\d{9,13}$/.test(phone)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }

      const customer = await prisma.customers.update({
        where: { id },
        data: {
          name: name?.trim() ?? existingCustomer.name,
          phone: phone?.trim() ?? existingCustomer.phone,
          address: address?.trim() ?? existingCustomer.address,
          status: status?.toUpperCase() ?? existingCustomer.status,
        },
      });
      console.log(`Updated customer ${id} by user ${req.user.id}:`, customer);
      res
        .status(200)
        .json({ message: "Customer updated successfully", customer });
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error.stack);
      res
        .status(500)
        .json({ message: "Error updating customer", error: error.message });
    }
  },

  deleteCustomer: async (req, res) => {
    const { id } = req.params;

    try {
      const customer = await prisma.customers.findUnique({ where: { id } });
      if (!customer) {
        console.log(`Customer ID ${id} not found for user ${req.user.id}`);
        return res.status(404).json({ message: "Customer not found" });
      }

      const [customerSales, customerCredits] = await Promise.all([
        prisma.sales.count({ where: { customer_id: id } }),
        prisma.customerCredit.count({ where: { customer_id: id } }),
      ]);

      if (customerSales > 0 || customerCredits > 0) {
        return res.status(400).json({
          message: "Cannot delete customer with associated sales or credits",
        });
      }

      await prisma.customers.delete({ where: { id } });
      console.log(`Deleted customer ${id} by user ${req.user.id}`);
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error.stack);
      res
        .status(500)
        .json({ message: "Error deleting customer", error: error.message });
    }
  },

  getAllCustomerCredits: async (req, res) => {
    try {
      const customerCredits = await prisma.customerCredit.findMany({
        include: {
          customer: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      console.log(
        `Fetched ${customerCredits.length} customer credits by user ${req.user.id}`
      );
      res.json(customerCredits);
    } catch (error) {
      console.error("Error fetching customer credits:", error.stack);
      res.status(500).json({
        message: "Error fetching customer credits",
        error: error.message,
      });
    }
  },

  getCustomerCredits: async (req, res) => {
    const { customer_id } = req.params;

    try {
      const customer = await prisma.customers.findUnique({
        where: { id: customer_id },
      });
      if (!customer) {
        console.log(
          `Customer ID ${customer_id} not found for user ${req.user.id}`
        );
        return res.status(404).json({ message: "Customer not found" });
      }

      const customerCredits = await prisma.customerCredit.findMany({
        where: { customer_id },
        include: {
          customer: { select: { name: true } },
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
        orderBy: { credit_date: "desc" },
      });

      console.log(
        `Fetched ${customerCredits.length} credits for customer ${customer_id} by user ${req.user.id}`
      );
      res.status(200).json({
        creditCount: customerCredits.length,
        credits: customerCredits,
      });
    } catch (error) {
      console.error(
        `Error fetching customer credits for ${customer_id} by user ${req.user.id}:`,
        error.stack
      );
      res.status(500).json({
        message: "Error fetching customer credits",
        error: error.message,
      });
    }
  },

  addCustomerCredit: async (req, res) => {
    const {
      customer_id,
      credit_amount,
      paid_amount = 0,
      medicine_name,
      payment_method = "NONE",
      description,
    } = req.body;
    const payment_file = req.file
      ? path.relative(__dirname, req.file.path).replace(/\\/g, "/")
      : null;

    if (!customer_id?.trim() || !credit_amount?.toString().trim()) {
      return res
        .status(400)
        .json({ message: "Customer ID and credit amount are required" });
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
      const customer = await prisma.customers.findUnique({
        where: { id: customer_id },
      });
      if (!customer) {
        console.log(
          `Customer ID ${customer_id} not found for user ${req.user.id}`
        );
        return res.status(404).json({ message: "Customer not found" });
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
      let status;
      if (parsedPaidAmount === 0) status = "UNPAID";
      else if (parsedPaidAmount < parsedCreditAmount) status = "PARTIALLY_PAID";
      else status = "PAID";

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
      const customerCredit = await prisma.customerCredit.create({
        data: {
          customer_id,
          credit_amount: parsedCreditAmount,
          paid_amount: parsedPaidAmount,
          unpaid_amount,
          total_unpaid_amount: unpaid_amount,
          total_paid_amount: parsedPaidAmount,
          medicine_name: medicine_name?.trim() || null,
          payment_method: finalPaymentMethod,
          description: description?.trim() || null,
          status,
          credit_date: currentETTime,
          payment_file,
          updated_at: currentETTime,
          created_by: req.user.id,
          updated_by: req.user.id,
        },
        include: {
          customer: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      console.log(
        `Created credit for customer ${customer_id} by user ${req.user.id}:`,
        customerCredit
      );
      res.status(201).json({
        message: "Customer credit created successfully",
        credit: customerCredit,
      });
    } catch (error) {
      console.error("Error adding customer credit:", error.stack);
      res.status(500).json({
        message: "Error adding customer credit",
        error: error.message,
      });
    }
  },

  editCustomerCredit: async (req, res) => {
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
      const existingCredit = await prisma.customerCredit.findUnique({
        where: { id },
      });
      if (!existingCredit) {
        console.log(`Credit ID ${id} not found for user ${req.user.id}`);
        return res.status(404).json({ message: "Customer credit not found" });
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
      let status;
      if (newPaidAmount === 0) status = "UNPAID";
      else if (newPaidAmount < newCreditAmount) status = "PARTIALLY_PAID";
      else status = "PAID";

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
      const updatedCredit = await prisma.customerCredit.update({
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
          status,
          payment_file:
            payment_file !== undefined
              ? payment_file
              : existingCredit.payment_file,
          updated_at: currentETTime,
          updated_by: req.user.id,
        },
        include: {
          customer: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      console.log(
        `Updated credit ${id} by user ${req.user.id}:`,
        updatedCredit
      );
      res.status(200).json({
        message: "Customer credit updated successfully",
        credit: updatedCredit,
      });
    } catch (error) {
      console.error(`Error updating customer credit ${id}:`, error.stack);
      res.status(500).json({
        message: "Error updating customer credit",
        error: error.message,
      });
    }
  },

  deleteCustomerCredit: async (req, res) => {
    const { id } = req.params;

    try {
      const customerCredit = await prisma.customerCredit.findUnique({
        where: { id },
      });
      if (!customerCredit) {
        console.log(`Credit ID ${id} not found for user ${req.user.id}`);
        return res.status(404).json({ message: "Customer credit not found" });
      }

      await prisma.customerCredit.delete({ where: { id } });
      console.log(`Deleted credit ${id} by user ${req.user.id}`);
      res.json({ message: "Customer credit deleted successfully" });
    } catch (error) {
      console.error(`Error deleting customer credit ${id}:`, error.stack);
      res.status(500).json({
        message: "Error deleting customer credit",
        error: error.message,
      });
    }
  },

  generateCreditReport: async (req, res) => {
    const {
      start_date,
      end_date,
      customer_id,
      limit = 100,
      offset = 0,
    } = req.query;

    try {
      const filters = { AND: [] };
      if (customer_id) filters.customer_id = customer_id;
      if (start_date || end_date) {
        filters.credit_date = {};
        if (start_date) filters.credit_date.gte = new Date(start_date);
        if (end_date) filters.credit_date.lte = new Date(end_date);
      }

      const [credits, totalCount] = await Promise.all([
        prisma.customerCredit.findMany({
          where: filters,
          include: {
            customer: { select: { name: true } },
            createdBy: { select: { username: true } },
            updatedBy: { select: { username: true } },
          },
          orderBy: { credit_date: "desc" },
          take: Math.min(parseInt(limit), 1000),
          skip: parseInt(offset),
        }),
        prisma.customerCredit.count({ where: filters }),
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
        `Generated report with ${credits.length} customer credits by user ${req.user.id}`
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
      console.error("Error generating customer credit report:", error.stack);
      res.status(500).json({
        message: "Error generating customer credit report",
        error: error.message,
      });
    }
  },
};

export default customerController;
