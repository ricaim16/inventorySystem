import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getEthiopianTime(date = new Date()) {
  const utcDate = new Date(date);
  const etOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
  return new Date(utcDate.getTime() + etOffset);
}

export const returnsController = {
  getAllReturns: async (req, res) => {
    try {
      const returns = await prisma.returns.findMany({
        include: {
          medicine: { select: { medicine_name: true } },
          dosage_form: { select: { name: true } },
        },
        orderBy: { return_date: "desc" },
      });
      console.log(
        `Fetched ${returns.length} returns by user ${req.user?.id || "unknown"}`
      );
      res.json(returns);
    } catch (error) {
      console.error("Error fetching returns:", error.stack);
      res.status(500).json({
        message: "Error fetching returns",
        error: error.message,
      });
    }
  },

  getReturnById: async (req, res) => {
    const { id } = req.params;
    try {
      const returnItem = await prisma.returns.findUnique({
        where: { id },
        include: {
          medicine: { select: { medicine_name: true } },
          dosage_form: { select: { name: true } },
        },
      });
      if (!returnItem) {
        console.log(`Return with ID ${id} not found`);
        return res.status(404).json({ message: "Return not found" });
      }
      console.log(`Fetched return ${id} by user ${req.user?.id || "unknown"}`);
      res.json(returnItem);
    } catch (error) {
      console.error(`Error fetching return ${id}:`, error.stack);
      res.status(500).json({
        message: "Error fetching return",
        error: error.message,
      });
    }
  },

  getReturnsBySaleId: async (req, res) => {
    const { sale_id } = req.query;
    if (!sale_id) {
      return res.status(400).json({ message: "Sale ID is required" });
    }

    try {
      const returns = await prisma.returns.findMany({
        where: { sale_id },
        include: {
          medicine: { select: { medicine_name: true } },
          dosage_form: { select: { name: true } },
        },
      });
      console.log(
        `Fetched ${returns.length} returns for sale ${sale_id} by user ${
          req.user?.id || "unknown"
        }`
      );
      res.json(returns);
    } catch (error) {
      console.error(`Error fetching returns for sale ${sale_id}:`, error.stack);
      res.status(500).json({
        message: "Error fetching returns",
        error: error.message,
      });
    }
  },

  addReturn: async (req, res) => {
    const {
      sale_id,
      medicine_id,
      dosage_form_id,
      quantity,
      reason_for_return,
      product_name,
      product_batch_number,
    } = req.body;

    if (
      !sale_id ||
      !medicine_id ||
      !dosage_form_id ||
      !quantity ||
      !reason_for_return
    ) {
      return res.status(400).json({
        message:
          "Sale ID, Medicine ID, dosage form ID, quantity, and reason are required",
      });
    }

    try {
      if (!req.user?.id) {
        console.log("No user ID in request");
        return res.status(401).json({ message: "Authentication required" });
      }

      // Fetch the sale to validate quantity
      const sale = await prisma.sales.findUnique({
        where: { id: sale_id },
      });
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }

      // Fetch all existing returns for this sale
      const existingReturns = await prisma.returns.findMany({
        where: { sale_id },
        select: { quantity: true },
      });
      const totalReturnedQuantity = existingReturns.reduce(
        (sum, ret) => sum + ret.quantity,
        0
      );

      const parsedQuantity = parseInt(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      // Check if the new return quantity exceeds the remaining sale quantity
      if (totalReturnedQuantity + parsedQuantity > sale.quantity) {
        return res.status(400).json({
          message: `Return quantity exceeds available sale quantity. Only ${
            sale.quantity - totalReturnedQuantity
          } units remain available for return.`,
        });
      }

      const [medicine, dosageForm] = await Promise.all([
        prisma.medicines.findUnique({
          where: { id: medicine_id },
          select: {
            id: true,
            medicine_name: true,
            batch_number: true,
            quantity: true,
          },
        }),
        prisma.dosageForms.findUnique({ where: { id: dosage_form_id } }),
      ]);

      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      if (!dosageForm) {
        return res.status(404).json({ message: "Dosage form not found" });
      }

      const currentETTime = getEthiopianTime();

      console.log(
        `Adding return for medicine ${medicine_id}, current quantity: ${medicine.quantity}, incrementing by: ${parsedQuantity}`
      );

      const [returnItem, updatedMedicine, updatedSale] =
        await prisma.$transaction([
          prisma.returns.create({
            data: {
              sale_id,
              product_name: product_name || medicine.medicine_name,
              product_batch_number:
                product_batch_number || medicine.batch_number || null,
              dosage_form_id,
              return_date: currentETTime,
              reason_for_return,
              quantity: parsedQuantity,
              medicine_id,
            },
            include: {
              medicine: { select: { medicine_name: true } },
              dosage_form: { select: { name: true } },
            },
          }),
          prisma.medicines.update({
            where: { id: medicine_id },
            data: { quantity: { increment: parsedQuantity } },
            select: { quantity: true },
          }),
          prisma.sales.update({
            where: { id: sale_id },
            data: { quantity: { decrement: parsedQuantity } },
            select: { quantity: true },
          }),
        ]);

      console.log(
        `Created return by user ${req.user.id}, new medicine quantity: ${updatedMedicine.quantity}, new sale quantity: ${updatedSale.quantity}`
      );

      res.status(201).json({
        message: "Return created successfully",
        return: returnItem,
      });
    } catch (error) {
      console.error("Error adding return:", error.stack);
      res.status(500).json({
        message: "Error adding return",
        error: error.message,
      });
    }
  },

  editReturn: async (req, res) => {
    const { id } = req.params;
    const {
      sale_id,
      medicine_id,
      dosage_form_id,
      quantity,
      reason_for_return,
      product_name,
      product_batch_number,
    } = req.body;

    try {
      const existingReturn = await prisma.returns.findUnique({
        where: { id },
      });
      if (!existingReturn) {
        return res.status(404).json({ message: "Return not found" });
      }

      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const saleIdToUse = sale_id || existingReturn.sale_id;
      const sale = await prisma.sales.findUnique({
        where: { id: saleIdToUse },
      });
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }

      const existingReturns = await prisma.returns.findMany({
        where: {
          sale_id: saleIdToUse,
          id: { not: id },
        },
        select: { quantity: true },
      });
      const totalReturnedQuantity = existingReturns.reduce(
        (sum, ret) => sum + ret.quantity,
        0
      );

      const parsedQuantity = quantity
        ? parseInt(quantity)
        : existingReturn.quantity;
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (totalReturnedQuantity + parsedQuantity > sale.quantity) {
        return res.status(400).json({
          message: `Return quantity exceeds available sale quantity. Only ${
            sale.quantity - totalReturnedQuantity
          } units remain available for return.`,
        });
      }

      const medicineIdToUse = medicine_id || existingReturn.medicine_id;
      const medicine = await prisma.medicines.findUnique({
        where: { id: medicineIdToUse },
        select: {
          id: true,
          medicine_name: true,
          batch_number: true,
          quantity: true,
        },
      });
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      const dosageForm = dosage_form_id
        ? await prisma.dosageForms.findUnique({ where: { id: dosage_form_id } })
        : null;
      if (dosage_form_id && !dosageForm) {
        return res.status(404).json({ message: "Dosage form not found" });
      }

      const quantityDifference = parsedQuantity - existingReturn.quantity;
      const currentETTime = getEthiopianTime();

      console.log(
        `Editing return ${id} for medicine ${medicineIdToUse}, current quantity: ${medicine.quantity}, quantity difference: ${quantityDifference}`
      );

      const transactionOperations = [
        prisma.returns.update({
          where: { id },
          data: {
            sale_id: sale_id ?? existingReturn.sale_id,
            product_name: product_name ?? existingReturn.product_name,
            product_batch_number:
              product_batch_number ??
              medicine.batch_number ??
              existingReturn.product_batch_number,
            dosage_form_id: dosage_form_id ?? existingReturn.dosage_form_id,
            return_date: currentETTime,
            reason_for_return:
              reason_for_return ?? existingReturn.reason_for_return,
            quantity: parsedQuantity,
            medicine_id: medicine_id ?? existingReturn.medicine_id,
          },
          include: {
            medicine: { select: { medicine_name: true } },
            dosage_form: { select: { name: true } },
          },
        }),
      ];

      if (quantityDifference !== 0) {
        transactionOperations.push(
          prisma.medicines.update({
            where: { id: medicineIdToUse },
            data: {
              quantity: { increment: quantityDifference },
            },
          }),
          prisma.sales.update({
            where: { id: saleIdToUse },
            data: {
              quantity: { decrement: quantityDifference },
            },
          })
        );
      }

      const [updatedReturn] = await prisma.$transaction(transactionOperations);

      // Verify the updated medicine quantity
      const updatedMedicine = await prisma.medicines.findUnique({
        where: { id: medicineIdToUse },
        select: { quantity: true },
      });
      console.log(
        `Updated return ${id} by user ${req.user.id}, new medicine quantity: ${updatedMedicine.quantity}`
      );

      res.status(200).json({
        message: "Return updated successfully",
        return: updatedReturn,
      });
    } catch (error) {
      console.error(`Error updating return ${id}:`, error.stack);
      res.status(500).json({
        message: "Error updating return",
        error: error.message,
      });
    }
  },

  
  deleteReturn: async (req, res) => {
    const { id } = req.params;

    try {
      const returnItem = await prisma.returns.findUnique({
        where: { id },
      });
      if (!returnItem) {
        return res.status(404).json({ message: "Return not found" });
      }

      console.log(
        `Deleting return ${id} for medicine ${returnItem.medicine_id}, decrementing quantity by: ${returnItem.quantity}`
      );

      await prisma.$transaction([
        prisma.returns.delete({ where: { id } }),
        prisma.medicines.update({
          where: { id: returnItem.medicine_id },
          data: { quantity: { decrement: returnItem.quantity } },
        }),
      ]);

      // Verify the updated medicine quantity
      const updatedMedicine = await prisma.medicines.findUnique({
        where: { id: returnItem.medicine_id },
        select: { quantity: true },
      });
      console.log(
        `Deleted return ${id} by user ${
          req.user?.id || "unknown"
        }, new medicine quantity: ${updatedMedicine.quantity}`
      );

      res.json({ message: "Return deleted successfully" });
    } catch (error) {
      console.error(`Error deleting return ${id}:`, error.stack);
      res.status(500).json({
        message: "Error deleting return",
        error: error.message,
      });
    }
  },
};
