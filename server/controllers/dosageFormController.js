import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dosageFormController = {
  getAllDosageForms: async (req, res) => {
    try {
      const dosageForms = await prisma.dosageForms.findMany({
        select: { id: true, name: true }, // Only id and name for dropdown
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
      const normalizedName = name.toLowerCase();
      const dosageForm = await prisma.dosageForms.create({
        data: { name: normalizedName },
      });
      res
        .status(201)
        .json({ message: "Dosage form added successfully", dosageForm });
    } catch (error) {
      if (error.code === "P2002") {
        res.status(409).json({
          message: "Name is unique. You can't add it, you already have it.",
        });
      } else {
        res
          .status(500)
          .json({ message: "Error adding dosage form", error: error.message });
      }
    }
  },

  editDosageForm: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Dosage form name is required" });

    try {
      const normalizedName = name.toLowerCase();
      const dosageForm = await prisma.dosageForms.update({
        where: { id },
        data: { name: normalizedName },
      });
      res
        .status(200)
        .json({ message: "Dosage form updated successfully", dosageForm });
    } catch (error) {
      if (error.code === "P2002") {
        res.status(409).json({
          message:
            "Name is unique. You can't update to a name that already exists.",
        });
      } else {
        res
          .status(500)
          .json({
            message: "Error updating dosage form",
            error: error.message,
          });
      }
    }
  },

  deleteDosageForm: async (req, res) => {
    const { id } = req.params;
    try {
      const dosageForm = await prisma.dosageForms.findUnique({
        where: { id },
        include: { Medicines: { select: { id: true } } },
      });

      if (!dosageForm) {
        return res.status(404).json({ message: "Dosage form not found" });
      }

      if (dosageForm.Medicines.length > 0) {
        return res.status(409).json({
          message:
            "Cannot delete dosage form because it is associated with one or more medicines",
        });
      }

      await prisma.dosageForms.delete({ where: { id } });
      res.json({ message: "Dosage form deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting dosage form", error: error.message });
    }
  },
};
