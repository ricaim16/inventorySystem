import prisma from "../config/db.js";
import { notificationService } from "./notificationService.js";

function getEthiopianTime(date = new Date()) {
  const utcDate = new Date(date);
  const etOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
  return new Date(utcDate.getTime() + etOffset);
}

export const salesController = {
  getAllSales: async (req, res) => {
    try {
      const sales = await prisma.sales.findMany({
        include: {
          medicine: { select: { medicine_name: true } },
          customer: { select: { name: true } },
          dosage_form: { select: { name: true } },
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
        orderBy: { sealed_date: "desc" },
      });
      console.log(
        `Fetched ${sales.length} sales by user ${req.user?.id || "unknown"}`
      );
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error.stack);
      res
        .status(500)
        .json({ message: "Error fetching sales", error: error.message });
    }
  },

  getSaleById: async (req, res) => {
    const { id } = req.params;
    try {
      const sale = await prisma.sales.findUnique({
        where: { id },
        include: {
          medicine: { select: { medicine_name: true } },
          customer: { select: { name: true } },
          dosage_form: { select: { name: true } },
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });
      if (!sale) {
        console.log(`Sale with ID ${id} not found`);
        return res.status(404).json({ message: "Sale not found" });
      }
      console.log(`Fetched sale ${id} by user ${req.user?.id || "unknown"}`);
      res.json(sale);
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error.stack);
      res
        .status(500)
        .json({ message: "Error fetching sale", error: error.message });
    }
  },

  addSale: async (req, res) => {
    const {
      medicine_id,
      customer_id,
      dosage_form_id,
      quantity,
      prescription,
      product_name,
      product_batch_number,
      payment_method,
    } = req.body;

    if (
      !medicine_id ||
      !dosage_form_id ||
      !quantity ||
      !product_batch_number ||
      !payment_method
    ) {
      return res.status(400).json({
        message:
          "Medicine ID, dosage form ID, quantity, batch number, and payment method are required",
      });
    }

    try {
      if (!req.user?.id) {
        console.log("No user ID in request");
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
      });
      if (!user) {
        console.log(`User ${req.user.id} not found`);
        return res.status(401).json({ message: "Invalid user ID" });
      }

      const [medicine, dosageForm] = await Promise.all([
        prisma.medicines.findUnique({
          where: { id: medicine_id },
          select: {
            id: true,
            quantity: true,
            sell_price: true,
            required_prescription: true,
            medicine_name: true,
          },
        }),
        prisma.dosageForms.findUnique({ where: { id: dosage_form_id } }),
      ]);

      if (!medicine)
        return res.status(404).json({ message: "Medicine not found" });
      if (!dosageForm)
        return res.status(404).json({ message: "Dosage form not found" });

      let customer = null;
      if (customer_id) {
        customer = await prisma.customers.findUnique({
          where: { id: customer_id },
        });
        if (!customer)
          return res.status(404).json({ message: "Customer not found" });
      }

      const parsedQuantity = parseInt(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (medicine.required_prescription && !prescription) {
        return res
          .status(400)
          .json({ message: "This medicine requires a prescription" });
      }

      if (medicine.quantity < parsedQuantity) {
        return res.status(400).json({
          message: `Insufficient inventory. Available quantity: ${medicine.quantity}`,
        });
      }

      const price = medicine.sell_price || 0;
      const total_amount = parsedQuantity * price;
      const currentETTime = getEthiopianTime();

      const [sale] = await prisma.$transaction([
        prisma.sales.create({
          data: {
            product_name: product_name || medicine.medicine_name,
            product_batch_number,
            quantity: parsedQuantity,
            price,
            total_amount,
            payment_method,
            prescription: prescription === true,
            dosage_form_id,
            customer_id: customer_id || null,
            sealed_date: currentETTime,
            medicine_id,
            created_by: req.user.id,
            updated_by: req.user.id,
            created_at: currentETTime,
            updated_at: currentETTime,
          },
          include: {
            medicine: { select: { medicine_name: true } },
            customer: { select: { name: true } },
            dosage_form: { select: { name: true } },
            createdBy: { select: { username: true } },
            updatedBy: { select: { username: true } },
          },
        }),
        prisma.medicines.update({
          where: { id: medicine_id },
          data: {
            quantity: { decrement: parsedQuantity },
            total_price: { decrement: parsedQuantity * medicine.sell_price },
          },
        }),
      ]);

      // Trigger low stock notification
      await notificationService.handleSaleNotification(
        medicine_id,
        parsedQuantity,
        medicine.medicine_name
      );

      console.log(`Created sale by user ${req.user.id}:`, sale);
      res.status(201).json({ message: "Sale created successfully", sale });
    } catch (error) {
      console.error("Error adding sale:", error.stack);
      res
        .status(500)
        .json({ message: "Error adding sale", error: error.message });
    }
  },

  editSale: async (req, res) => {
    const { id } = req.params;
    const {
      medicine_id,
      customer_id,
      dosage_form_id,
      quantity,
      prescription,
      product_name,
      product_batch_number,
      payment_method,
      sealed_date,
    } = req.body;

    console.log(`Starting editSale for ID ${id}`, {
      user: req.user,
      body: req.body,
    });

    try {
      const existingSale = await prisma.sales.findUnique({ where: { id } });
      if (!existingSale) {
        console.log(`Sale ${id} not found`);
        return res.status(404).json({ message: "Sale not found" });
      }

      if (!req.user?.id) {
        console.log("No user ID in request");
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
      });
      if (!user) {
        console.log(`User ${req.user.id} not found`);
        return res.status(401).json({ message: "Invalid user ID" });
      }

      const medicineIdToUse = medicine_id || existingSale.medicine_id;
      const medicine = await prisma.medicines.findUnique({
        where: { id: medicineIdToUse },
        select: {
          id: true,
          quantity: true,
          sell_price: true,
          required_prescription: true,
          medicine_name: true,
        },
      });
      if (!medicine) {
        console.log(`Medicine ${medicineIdToUse} not found`);
        return res.status(404).json({ message: "Medicine not found" });
      }

      let customer = null;
      if (customer_id) {
        customer = await prisma.customers.findUnique({
          where: { id: customer_id },
        });
        if (!customer) {
          console.log(`Customer ${customer_id} not found`);
          return res.status(404).json({ message: "Customer not found" });
        }
      }

      const dosageForm = dosage_form_id
        ? await prisma.dosageForms.findUnique({ where: { id: dosage_form_id } })
        : null;
      if (dosage_form_id && !dosageForm) {
        console.log(`Dosage form ${dosage_form_id} not found`);
        return res.status(404).json({ message: "Dosage form not found" });
      }

      const parsedQuantity = quantity
        ? parseInt(quantity)
        : existingSale.quantity;
      if (quantity && (isNaN(parsedQuantity) || parsedQuantity < 0)) {
        console.log(`Invalid quantity: ${quantity}`);
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (
        medicine.required_prescription &&
        (prescription !== undefined
          ? !prescription
          : !existingSale.prescription)
      ) {
        console.log("Prescription required but not provided");
        return res
          .status(400)
          .json({ message: "This medicine requires a prescription" });
      }

      const quantityDifference = parsedQuantity - existingSale.quantity;
      if (quantityDifference > 0 && medicine.quantity < quantityDifference) {
        console.log(`Insufficient inventory: ${medicine.quantity} available`);
        return res.status(400).json({
          message: `Insufficient inventory. Available quantity: ${medicine.quantity}`,
        });
      }

      const price = medicine.sell_price || 0;
      const total_amount = parsedQuantity * price;
      const currentETTime = getEthiopianTime();

      const [updatedSale] = await prisma.$transaction([
        prisma.sales.update({
          where: { id },
          data: {
            product_name: product_name ?? existingSale.product_name,
            product_batch_number:
              product_batch_number ?? existingSale.product_batch_number,
            quantity: parsedQuantity,
            price,
            total_amount,
            payment_method: payment_method ?? existingSale.payment_method,
            prescription: prescription ?? existingSale.prescription,
            dosage_form_id: dosage_form_id ?? existingSale.dosage_form_id,
            customer_id: customer_id ?? existingSale.customer_id,
            medicine_id: medicine_id ?? existingSale.medicine_id,
            sealed_date: sealed_date
              ? getEthiopianTime(sealed_date)
              : existingSale.sealed_date,
            updated_at: currentETTime,
            updated_by: req.user.id,
          },
          include: {
            medicine: { select: { medicine_name: true } },
            customer: { select: { name: true } },
            dosage_form: { select: { name: true } },
            createdBy: { select: { username: true } },
            updatedBy: { select: { username: true } },
          },
        }),
        ...(quantityDifference !== 0
          ? [
              prisma.medicines.update({
                where: { id: medicineIdToUse },
                data: {
                  quantity:
                    quantityDifference >= 0
                      ? { decrement: quantityDifference }
                      : { increment: -quantityDifference },
                  total_price:
                    quantityDifference >= 0
                      ? { decrement: quantityDifference * medicine.sell_price }
                      : {
                          increment: -quantityDifference * medicine.sell_price,
                        },
                },
              }),
            ]
          : []),
      ]);

      // Trigger low stock notification if quantity changed
      if (quantityDifference !== 0) {
        await notificationService.handleSaleNotification(
          medicineIdToUse,
          Math.abs(quantityDifference),
          medicine.medicine_name
        );
      }

      console.log(`Updated sale ${id} successfully:`, updatedSale);
      res
        .status(200)
        .json({ message: "Sale updated successfully", sale: updatedSale });
    } catch (error) {
      console.error(`Error updating sale ${id}:`, {
        message: error.message,
        stack: error.stack,
        body: req.body,
      });
      res
        .status(500)
        .json({ message: "Error updating sale", error: error.message });
    }
  },

  deleteSale: async (req, res) => {
    const { id } = req.params;

    try {
      const sale = await prisma.sales.findUnique({ where: { id } });
      if (!sale) return res.status(404).json({ message: "Sale not found" });

      const medicine = await prisma.medicines.findUnique({
        where: { id: sale.medicine_id },
        select: { sell_price: true, medicine_name: true },
      });

      await prisma.$transaction([
        prisma.sales.delete({ where: { id } }),
        prisma.medicines.update({
          where: { id: sale.medicine_id },
          data: {
            quantity: { increment: sale.quantity },
            total_price: {
              increment: sale.quantity * (medicine.sell_price || 0),
            },
          },
        }),
      ]);

      // Trigger low stock notification
      await notificationService.handleSaleNotification(
        sale.medicine_id,
        -sale.quantity,
        medicine.medicine_name
      );

      console.log(`Deleted sale ${id} by user ${req.user?.id || "unknown"}`);
      res.json({ message: "Sale deleted successfully" });
    } catch (error) {
      console.error(`Error deleting sale ${id}:`, error.stack);
      res
        .status(500)
        .json({ message: "Error deleting sale", error: error.message });
    }
  },

  generateSalesReport: async (req, res) => {
    const {
      start_date,
      end_date,
      customer_id,
      limit = "100",
      offset = "0",
    } = req.query;

    console.log("Starting sales report generation with query:", req.query);

    try {
      const parsedLimit = parseInt(limit);
      const parsedOffset = parseInt(offset);

      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({ message: "Invalid limit value" });
      }
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return res.status(400).json({ message: "Invalid offset value" });
      }

      const filters = {};

      if (customer_id) {
        filters.customer_id = customer_id;
        const customerExists = await prisma.customers.findUnique({
          where: { id: customer_id },
        });
        if (!customerExists) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }

      if (start_date || end_date) {
        filters.sealed_date = {};

        if (start_date) {
          const startDate = new Date(start_date);
          if (isNaN(startDate.getTime())) {
            return res.status(400).json({
              message: "Invalid start_date format. Use ISO format (YYYY-MM-DD)",
            });
          }
          filters.sealed_date.gte = getEthiopianTime(startDate);
        }

        if (end_date) {
          const endDate = new Date(end_date);
          if (isNaN(endDate.getTime())) {
            return res.status(400).json({
              message: "Invalid end_date format. Use ISO format (YYYY-MM-DD)",
            });
          }
          filters.sealed_date.lte = getEthiopianTime(endDate);
        }

        if (
          start_date &&
          end_date &&
          filters.sealed_date.gte > filters.sealed_date.lte
        ) {
          return res.status(400).json({
            message: "start_date must be before end_date",
          });
        }
      }

      const sales = await prisma.sales.findMany({
        where: filters,
        include: {
          medicine: { select: { medicine_name: true } },
          customer: { select: { name: true } },
          dosage_form: { select: { name: true } },
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
        orderBy: { sealed_date: "desc" },
        take: Math.min(parsedLimit, 1000),
        skip: parsedOffset,
      });

      const totalSales = sales.reduce(
        (sum, sale) => sum + (Number(sale.total_amount) || 0),
        0
      );
      const totalQuantity = sales.reduce(
        (sum, sale) => sum + (Number(sale.quantity) || 0),
        0
      );

      console.log(
        `Report generated: ${sales.length} sales by user ${
          req.user?.id || "unknown"
        }`
      );
      return res.status(200).json({
        summary: {
          salesCount: sales.length,
          totalSales: Number(totalSales.toFixed(2)),
          totalQuantity,
          startDate: start_date ? filters.sealed_date?.gte : undefined,
          endDate: end_date ? filters.sealed_date?.lte : undefined,
          customerId: customer_id || undefined,
        },
        sales,
        message:
          sales.length === 0
            ? "No sales found for the specified filters"
            : "Sales report generated successfully",
      });
    } catch (error) {
      console.error("Error generating sales report:", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      return res.status(500).json({
        message: "Error generating sales report",
        error: error.message,
      });
    }
  },

  getMedicineByBatchNumber: async (req, res) => {
    const { batchNumber } = req.params;
    try {
      const medicine = await prisma.medicines.findUnique({
        where: { batch_number: batchNumber },
        select: {
          id: true,
          medicine_name: true,
          sell_price: true,
          quantity: true,
          dosage_form_id: true,
          required_prescription: true,
        },
      });
      if (!medicine) {
        console.log(`Medicine with batch number ${batchNumber} not found`);
        return res.status(404).json({ message: "Medicine not found" });
      }
      console.log(`Fetched medicine with batch number ${batchNumber}`);
      res.json(medicine);
    } catch (error) {
      console.error(
        `Error fetching medicine with batch number ${batchNumber}:`,
        error.stack
      );
      res
        .status(500)
        .json({ message: "Error fetching medicine", error: error.message });
    }
  },
};

export { getEthiopianTime };
