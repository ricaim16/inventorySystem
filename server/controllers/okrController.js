import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all objectives with their key results
const getAllObjectives = async (req, res) => {
  try {
    const objectives = await prisma.objectives.findMany({
      include: {
        KeyResults: true,
      },
    });
    res.status(200).json(objectives);
  } catch (error) {
    console.error("Error fetching objectives:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({ error: "Failed to fetch objectives" });
  }
};

// Get objective by ID with its key results
const getObjectiveById = async (req, res) => {
  const { id } = req.params;

  try {
    const objective = await prisma.objectives.findUnique({
      where: { id },
      include: {
        KeyResults: true,
      },
    });
    if (!objective) {
      return res.status(404).json({ error: "OKR not found" });
    }
    res.status(200).json(objective);
  } catch (error) {
    console.error("Error fetching objective by ID:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({ error: "Failed to fetch objective" });
  }
};

// Add a new objective
const addObjective = async (req, res) => {
  const { title, description, time_period, progress } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Objective title is required" });
  }

  try {
    const objective = await prisma.objectives.create({
      data: {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description || "",
        time_period: time_period || "Q2 2025",
        progress: parseFloat(progress) || 0,
      },
    });
    res.status(201).json({ id: objective.id, ...objective });
  } catch (error) {
    console.error("Error creating objective:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res
      .status(500)
      .json({ error: "Failed to create objective", details: error.message });
  }
};

// Add a new key result
const addKeyResult = async (req, res) => {
  const {
    objective_id,
    title,
    description,
    start_value,
    target_value,
    progress,
    weight,
    deadline,
  } = req.body;

  if (
    !objective_id ||
    !title ||
    !title.trim() ||
    target_value === undefined ||
    deadline === undefined
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: objective_id, title, target_value, deadline",
    });
  }

  const targetVal = parseFloat(target_value);
  const startVal = parseFloat(start_value) || 0;
  const prog = parseFloat(progress) || 0;
  const wgt = parseFloat(weight) || 1;

  if (isNaN(targetVal) || targetVal <= startVal) {
    return res
      .status(400)
      .json({
        error: "Target value must be a number greater than start value",
      });
  }
  if (isNaN(prog) || prog < 0) {
    return res.status(400).json({ error: "Progress must be non-negative" });
  }
  if (isNaN(wgt) || wgt <= 0) {
    return res.status(400).json({ error: "Weight must be positive" });
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return res
      .status(400)
      .json({ error: "Invalid deadline: must be a valid date" });
  }

  try {
    const objective = await prisma.objectives.findUnique({
      where: { id: objective_id },
    });
    if (!objective) {
      return res
        .status(404)
        .json({ error: `Objective with ID ${objective_id} not found` });
    }

    const keyResult = await prisma.keyResults.create({
      data: {
        id: crypto.randomUUID(),
        objective_id,
        title: title.trim(),
        description: description || "",
        start_value: startVal,
        target_value: targetVal,
        progress: prog,
        weight: wgt,
        deadline: deadlineDate,
      },
    });
    res.status(201).json(keyResult);
  } catch (error) {
    console.error("Error creating key result:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      payload: req.body,
    });
    if (error.code === "P2003") {
      return res.status(400).json({
        error: "Foreign key constraint failed: objective_id does not exist",
      });
    }
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Unique constraint violation: key result may already exist",
      });
    }
    res.status(500).json({
      error: "Failed to create key result",
      details: error.message || "Unknown database error",
    });
  }
};

// Update a key result's progress
const updateKeyResult = async (req, res) => {
  const { id } = req.params;
  const { progress } = req.body;

  if (!id || isNaN(parseFloat(progress))) {
    return res
      .status(400)
      .json({ error: "Invalid key result ID or progress value" });
  }

  try {
    const keyResult = await prisma.keyResults.findUnique({
      where: { id },
    });
    if (!keyResult) {
      return res.status(404).json({ error: "Key result not found" });
    }

    if (
      parseFloat(progress) > keyResult.target_value ||
      parseFloat(progress) < 0
    ) {
      return res
        .status(400)
        .json({ error: "Progress must be between 0 and target value" });
    }

    const updatedKeyResult = await prisma.keyResults.update({
      where: { id },
      data: { progress: parseFloat(progress) },
    });
    res.status(200).json(updatedKeyResult);
  } catch (error) {
    console.error("Error updating key result:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({ error: "Failed to update key result" });
  }
};

// Update an objective's progress and activity
const updateObjective = async (req, res) => {
  const { id } = req.params;
  const { progress, activity } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Objective ID is required" });
  }

  try {
    const objective = await prisma.objectives.findUnique({
      where: { id },
    });
    if (!objective) {
      return res.status(404).json({ error: "Objective not found" });
    }

    const data = {};
    if (progress !== undefined) {
      data.progress = parseFloat(progress);
    }
    if (activity) {
      data.activity = activity;
    }

    const updatedObjective = await prisma.objectives.update({
      where: { id },
      data,
    });
    res.status(200).json(updatedObjective);
  } catch (error) {
    console.error("Error updating objective:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({ error: "Failed to update objective" });
  }
};

export {
  getAllObjectives,
  getObjectiveById,
  addObjective,
  addKeyResult,
  updateKeyResult,
  updateObjective,
};
