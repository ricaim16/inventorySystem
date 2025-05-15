import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const categoryController = {
  getAllCategories: async (req, res) => {
    try {
      const categories = await prisma.categories.findMany({
        include: { Medicines: { select: { medicine_name: true } } },
      });
      res.json(categories);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching categories", error: error.message });
    }
  },

  addCategory: async (req, res) => {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    try {
      const normalizedName = name.toLowerCase(); // Normalize to lowercase
      const category = await prisma.categories.create({
        data: { name: normalizedName },
      });
      res
        .status(201)
        .json({ message: "Category added successfully", category });
    } catch (error) {
      if (error.code === "P2002") {
        res.status(409).json({
          message: "Name is unique. You can't add it, you already have it.",
        });
      } else {
        res
          .status(500)
          .json({ message: "Error adding category", error: error.message });
      }
    }
  },

  editCategory: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    try {
      const normalizedName = name.toLowerCase(); // Normalize to lowercase
      const category = await prisma.categories.update({
        where: { id },
        data: { name: normalizedName },
      });
      res
        .status(200)
        .json({ message: "Category updated successfully", category });
    } catch (error) {
      if (error.code === "P2002") {
        res.status(409).json({
          message:
            "Name is unique. You can't update to a name that already exists.",
        });
      } else {
        res
          .status(500)
          .json({ message: "Error updating category", error: error.message });
      }
    }
  },

  deleteCategory: async (req, res) => {
    const { id } = req.params;
    try {
      const category = await prisma.categories.findUnique({
        where: { id },
        include: { Medicines: { select: { id: true } } },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      if (category.Medicines.length > 0) {
        return res.status(409).json({
          message:
            "Cannot delete category because it is associated with one or more medicines",
        });
      }

      await prisma.categories.delete({ where: { id } });
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting category", error: error.message });
    }
  },
};
