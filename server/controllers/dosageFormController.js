import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dosageFormController = {
  getAllDosageForms: async (req, res) => {
    try {
      const dosageForms = await prisma.dosageForms.findMany({
        include: { Medicines: { select: { medicine_name: true } } },
      });
      res.json(dosageForms);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching dosage forms", error: error.message });
    }
  },

  addDosageForm: async (req, res) => {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Dosage form name is required" });

    try {
      const dosageForm = await prisma.dosageForms.create({ data: { name } });
      res
        .status(201)
        .json({ message: "Dosage form added successfully", dosageForm });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error adding dosage form", error: error.message });
    }
  },

  editDosageForm: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
      const dosageForm = await prisma.dosageForms.update({
        where: { id },
        data: { name },
      });
      res
        .status(200)
        .json({ message: "Dosage form updated successfully", dosageForm });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating dosage form", error: error.message });
    }
  },

  deleteDosageForm: async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.dosageForms.delete({ where: { id } });
      res.json({ message: "Dosage form deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting dosage form", error: error.message });
    }
  },
};
