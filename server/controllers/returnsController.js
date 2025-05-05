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

  addReturn: async (req, res) => {
    const {
      medicine_id,
      dosage_form_id,
      quantity,
      reason_for_return,
      product_name,
      product_batch_number,
    } = req.body;

    if (!medicine_id || !dosage_form_id || !quantity || !reason_for_return) {
      return res.status(400).json({
        message:
          "Medicine ID, dosage form ID, quantity, and reason are required",
      });
    }

    try {
      if (!req.user?.id) {
        console.log("No user ID in request");
        return res.status(401).json({ message: "Authentication required" });
      }

      const [medicine, dosageForm] = await Promise.all([
        prisma.medicines.findUnique({
          where: { id: medicine_id },
          select: {
            id: true,
            medicine_name: true,
            batch_number: true,
          },
        }),
        prisma.dosageForms.findUnique({ where: { id: dosage_form_id } }),
      ]);

      if (!medicine)
        return res.status(404).json({ message: "Medicine not found" });
      if (!dosageForm)
        return res.status(404).json({ message: "Dosage form not found" });

      const parsedQuantity = parseInt(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const currentETTime = getEthiopianTime();

      const [returnItem] = await prisma.$transaction([
        prisma.returns.create({
          data: {
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
        }),
      ]);

      console.log(`Created return by user ${req.user.id}:`, returnItem);
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

      const parsedQuantity = quantity
        ? parseInt(quantity)
        : existingReturn.quantity;
      if (quantity && (isNaN(parsedQuantity) || parsedQuantity <= 0)) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const quantityDifference = parsedQuantity - existingReturn.quantity;
      const currentETTime = getEthiopianTime();

      const [updatedReturn] = await prisma.$transaction([
        prisma.returns.update({
          where: { id },
          data: {
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
        prisma.medicines.update({
          where: { id: medicineIdToUse },
          data: {
            quantity:
              quantityDifference >= 0
                ? { increment: quantityDifference }
                : { decrement: -quantityDifference },
          },
        }),
      ]);

      console.log(
        `Updated return ${id} by user ${req.user.id}:`,
        updatedReturn
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
      const returnItem = await prisma.returns.findUnique({ where: { id } });
      if (!returnItem) {
        return res.status(404).json({ message: "Return not found" });
      }

      await prisma.$transaction([
        prisma.returns.delete({ where: { id } }),
        prisma.medicines.update({
          where: { id: returnItem.medicine_id },
          data: { quantity: { decrement: returnItem.quantity } },
        }),
      ]);

      console.log(`Deleted return ${id} by user ${req.user?.id || "unknown"}`);
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
