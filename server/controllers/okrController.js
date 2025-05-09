import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createObjective = async (req, res) => {
  try {
    const { title, description, time_period, progress } = req.body;
    const objective = await prisma.objectives.create({
      data: {
        title,
        description,
        time_period,
        progress: parseFloat(progress),
      },
    });
    res.status(201).json(objective);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create objective", details: error.message });
  }
};

export const getObjectives = async (req, res) => {
  try {
    const objectives = await prisma.objectives.findMany({
      include: { KeyResults: true },
    });
    res.status(200).json(objectives);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch objectives", details: error.message });
  }
};

export const updateObjective = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, time_period, progress } = req.body;
    const objective = await prisma.objectives.update({
      where: { id },
      data: {
        title,
        description,
        time_period,
        progress: parseFloat(progress),
      },
    });
    res.status(200).json(objective);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update objective", details: error.message });
  }
};

export const deleteObjective = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.objectives.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete objective", details: error.message });
  }
};

export const createKeyResult = async (req, res) => {
  try {
    const { objective_id, title, description, weight, deadline, progress } =
      req.body;
    const keyResult = await prisma.keyResults.create({
      data: {
        objective_id,
        title,
        description,
        weight: parseFloat(weight),
        deadline: new Date(deadline),
        progress: parseFloat(progress),
      },
    });
    res.status(201).json(keyResult);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create key result", details: error.message });
  }
};

export const updateKeyResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, weight, deadline, progress } = req.body;
    const keyResult = await prisma.keyResults.update({
      where: { id },
      data: {
        title,
        description,
        weight: parseFloat(weight),
        deadline: new Date(deadline),
        progress: parseFloat(progress),
      },
    });
    res.status(200).json(keyResult);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update key result", details: error.message });
  }
};

export const deleteKeyResult = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.keyResults.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete key result", details: error.message });
  }
};
