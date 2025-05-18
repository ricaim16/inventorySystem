import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getObjectives = async (req, res) => {
  try {
    const objectives = await prisma.objectives.findMany({
      include: { KeyResults: true },
    });
    console.log(
      "Fetched objectives with key results:",
      JSON.stringify(objectives, null, 2)
    );
    res.status(200).json(objectives);
  } catch (error) {
    console.error("Fetch objectives error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      request: {
        user: req.user,
        headers: req.headers,
      },
    });
    res.status(500).json({
      error: "Failed to fetch objectives",
      details: error.message,
      code: error.code,
    });
  }
};

export const createObjective = async (req, res) => {
  const { title, description, time_period } = req.body;
  console.log("Create objective request:", {
    title,
    description,
    time_period,
    user: req.user,
  });
  try {
    if (!title?.trim() || !time_period?.trim()) {
      return res
        .status(400)
        .json({ error: "Title and time period are required" });
    }
    const objective = await prisma.objectives.create({
      data: {
        title,
        description: description?.trim() || null,
        time_period,
        progress: 0,
        activity: [],
      },
    });
    console.log("Created objective:", objective);
    res.status(201).json(objective);
  } catch (error) {
    console.error("Create objective error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      request: {
        body: req.body,
        user: req.user,
      },
    });
    res.status(500).json({
      error: "Failed to create objective",
      details: error.message,
      code: error.code,
    });
  }
};

export const createKeyResult = async (req, res) => {
  const {
    objective_id,
    title,
    description,
    start_value,
    target_value,
    weight,
    deadline,
    status,
    comment,
  } = req.body;
  console.log("Create key result request:", req.body);
  try {
    if (
      !objective_id?.trim() ||
      !title?.trim() ||
      target_value == null ||
      !deadline
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (target_value <= (start_value ?? 0)) {
      return res
        .status(400)
        .json({ error: "Target value must be greater than start value" });
    }
    if ((weight ?? 1) <= 0) {
      return res.status(400).json({ error: "Weight must be greater than 0" });
    }
    const objective = await prisma.objectives.findUnique({
      where: { id: objective_id },
    });
    if (!objective) {
      return res.status(404).json({ error: "Objective not found" });
    }
    const keyResult = await prisma.keyResults.create({
      data: {
        objective_id,
        title,
        description: description?.trim() || null,
        start_value: parseFloat(start_value) ?? 0,
        target_value: parseFloat(target_value),
        weight: parseFloat(weight) ?? 1,
        deadline: new Date(deadline),
        progress: parseFloat(start_value) ?? 0,
        status: status?.trim() || "Not Started",
        comment: comment?.trim() || null,
      },
    });
    console.log("Created key result:", keyResult);

    // Recalculate and update objective progress
    const keyResults = await prisma.keyResults.findMany({
      where: { objective_id },
    });
    const totalWeightedProgress = keyResults.reduce((sum, kr) => {
      const range = kr.target_value - (kr.start_value ?? 0);
      if (range === 0) return sum;
      const krProgress =
        ((kr.progress - (kr.start_value ?? 0)) / range) *
        (kr.weight ?? 1) *
        100;
      return sum + (isNaN(krProgress) ? 0 : krProgress);
    }, 0);
    const totalWeight = keyResults.reduce(
      (sum, kr) => sum + (kr.weight ?? 1),
      0
    );
    const averageProgress =
      totalWeight > 0 ? totalWeightedProgress / totalWeight : 0;
    console.log(
      "Calculated averageProgress for objective",
      objective_id,
      ":",
      averageProgress
    );

    // Update objective with error handling and logging
    const updatedObjective = await prisma.objectives
      .update({
        where: { id: objective_id },
        data: { progress: averageProgress },
      })
      .catch((updateError) => {
        console.error("Failed to update objective progress:", {
          message: updateError.message,
          stack: updateError.stack,
          code: updateError.code,
          meta: updateError.meta,
        });
        throw updateError;
      });
    console.log(
      "Updated objective progress in database:",
      updatedObjective.progress
    );

    res.status(201).json(keyResult);
  } catch (error) {
    console.error("Create key result error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      request: {
        body: req.body,
        user: req.user,
      },
    });
    res.status(500).json({
      error: "Failed to create key result",
      details: error.message,
      code: error.code,
    });
  }
};

export const editObjective = async (req, res) => {
  const { id } = req.params;
  const { title, description, time_period } = req.body;
  console.log("Edit objective request:", {
    id,
    title,
    description,
    time_period,
  });
  try {
    if (!title?.trim() || !time_period?.trim()) {
      return res
        .status(400)
        .json({ error: "Title and time period are required" });
    }
    const objective = await prisma.objectives.update({
      where: { id },
      data: { title, description: description?.trim() || null, time_period },
    });
    res.status(200).json(objective);
  } catch (error) {
    console.error("Update objective error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({
      error: "Failed to update objective",
      details: error.message,
      code: error.code,
    });
  }
};

export const editKeyResult = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    start_value,
    target_value,
    weight,
    deadline,
    status,
    comment,
  } = req.body;
  console.log("Edit key result request:", { id, body: req.body });
  try {
    if (!title?.trim() || target_value == null || !deadline) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (target_value <= (start_value ?? 0)) {
      return res
        .status(400)
        .json({ error: "Target value must be greater than start value" });
    }
    if ((weight ?? 1) <= 0) {
      return res.status(400).json({ error: "Weight must be greater than 0" });
    }
    const keyResult = await prisma.keyResults.update({
      where: { id },
      data: {
        title,
        description: description?.trim() || null,
        start_value: parseFloat(start_value) ?? 0,
        target_value: parseFloat(target_value),
        weight: parseFloat(weight) ?? 1,
        deadline: new Date(deadline),
        status: status?.trim() || "No Status",
        comment: comment?.trim() || null,
      },
    });

    const keyResults = await prisma.keyResults.findMany({
      where: { objective_id: keyResult.objective_id },
    });
    const totalWeightedProgress = keyResults.reduce((sum, kr) => {
      const range = kr.target_value - (kr.start_value ?? 0);
      if (range === 0) return sum;
      const krProgress =
        ((kr.progress - (kr.start_value ?? 0)) / range) *
        (kr.weight ?? 1) *
        100;
      return sum + (isNaN(krProgress) ? 0 : krProgress);
    }, 0);
    const totalWeight = keyResults.reduce(
      (sum, kr) => sum + (kr.weight ?? 1),
      0
    );
    const averageProgress =
      totalWeight > 0 ? totalWeightedProgress / totalWeight : 0;
    console.log(
      "Calculated averageProgress for objective",
      keyResult.objective_id,
      ":",
      averageProgress
    );

    // Update objective with error handling and logging
    const updatedObjective = await prisma.objectives
      .update({
        where: { id: keyResult.objective_id },
        data: { progress: averageProgress },
      })
      .catch((updateError) => {
        console.error("Failed to update objective progress:", {
          message: updateError.message,
          stack: updateError.stack,
          code: updateError.code,
          meta: updateError.meta,
        });
        throw updateError;
      });
    console.log(
      "Updated objective progress in database:",
      updatedObjective.progress
    );

    res.status(200).json(keyResult);
  } catch (error) {
    console.error("Update key result error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({
      error: "Failed to update key result",
      details: error.message,
      code: error.code,
    });
  }
};

export const deleteObjective = async (req, res) => {
  const { id } = req.params;
  console.log("Delete objective request:", { id });
  try {
    await prisma.keyResults.deleteMany({
      where: { objective_id: id },
    });
    await prisma.objectives.delete({
      where: { id },
    });
    res.status(200).json({ message: "Objective deleted successfully" });
  } catch (error) {
    console.error("Delete objective error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({
      error: "Failed to delete objective",
      details: error.message,
      code: error.code,
    });
  }
};

export const deleteKeyResult = async (req, res) => {
  const { id } = req.params;
  console.log("Delete key result request:", { id });
  try {
    const keyResult = await prisma.keyResults.findUnique({ where: { id } });
    if (!keyResult) {
      return res.status(404).json({ error: "Key result not found" });
    }
    await prisma.keyResults.delete({
      where: { id },
    });

    const keyResults = await prisma.keyResults.findMany({
      where: { objective_id: keyResult.objective_id },
    });
    const totalWeightedProgress = keyResults.reduce((sum, kr) => {
      const range = kr.target_value - (kr.start_value ?? 0);
      if (range === 0) return sum;
      const krProgress =
        ((kr.progress - (kr.start_value ?? 0)) / range) *
        (kr.weight ?? 1) *
        100;
      return sum + (isNaN(krProgress) ? 0 : krProgress);
    }, 0);
    const totalWeight = keyResults.reduce(
      (sum, kr) => sum + (kr.weight ?? 1),
      0
    );
    const averageProgress =
      keyResults.length > 0 ? totalWeightedProgress / totalWeight : 0;
    console.log(
      "Calculated averageProgress for objective",
      keyResult.objective_id,
      ":",
      averageProgress
    );

    // Update objective with error handling and logging
    const updatedObjective = await prisma.objectives
      .update({
        where: { id: keyResult.objective_id },
        data: { progress: averageProgress },
      })
      .catch((updateError) => {
        console.error("Failed to update objective progress:", {
          message: updateError.message,
          stack: updateError.stack,
          code: updateError.code,
          meta: updateError.meta,
        });
        throw updateError;
      });
    console.log(
      "Updated objective progress in database:",
      updatedObjective.progress
    );

    res.status(200).json({ message: "Key result deleted successfully" });
  } catch (error) {
    console.error("Delete key result error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({
      error: "Failed to delete key result",
      details: error.message,
      code: error.code,
    });
  }
};

export const updateKeyResultProgress = async (req, res) => {
  const { id } = req.params;
  const { title, progress, comment, status } = req.body;
  console.log("Update key result progress request:", { id, body: req.body });
  try {
    if (!title?.trim() || typeof progress !== "number" || isNaN(progress)) {
      return res.status(400).json({
        error:
          "Title and progress are required, and progress must be a valid number",
      });
    }
    const keyResult = await prisma.keyResults.findUnique({ where: { id } });
    if (!keyResult) {
      return res.status(404).json({ error: "Key result not found" });
    }
    if (
      progress < (keyResult.start_value ?? 0) ||
      progress > keyResult.target_value
    ) {
      return res.status(400).json({
        error: "Progress must be between start and target values",
      });
    }

    const updatedKeyResult = await prisma.keyResults.update({
      where: { id },
      data: {
        title,
        progress: parseFloat(progress),
        status: status?.trim() || keyResult.status || "No Status",
        comment: comment?.trim() || null,
      },
    });

    const keyResults = await prisma.keyResults.findMany({
      where: { objective_id: updatedKeyResult.objective_id },
    });
    const totalWeightedProgress = keyResults.reduce((sum, kr) => {
      const range = kr.target_value - (kr.start_value ?? 0);
      if (range === 0) return sum;
      const krProgress =
        ((kr.progress - (kr.start_value ?? 0)) / range) *
        (kr.weight ?? 1) *
        100;
      return sum + (isNaN(krProgress) ? 0 : krProgress);
    }, 0);
    const totalWeight = keyResults.reduce(
      (sum, kr) => sum + (kr.weight ?? 1),
      0
    );
    const averageProgress =
      totalWeight > 0 ? totalWeightedProgress / totalWeight : 0;
    console.log(
      "Calculated averageProgress for objective",
      updatedKeyResult.objective_id,
      ":",
      averageProgress
    );

    // Update objective with error handling and logging
    const currentObjective = await prisma.objectives.findUnique({
      where: { id: updatedKeyResult.objective_id },
    });
    const activity = Array.isArray(currentObjective.activity)
      ? currentObjective.activity
      : [];
    const updatedObjective = await prisma.objectives
      .update({
        where: { id: updatedKeyResult.objective_id },
        data: {
          progress: averageProgress,
          activity: {
            push: {
              timestamp: new Date().toISOString(),
              comment: comment?.trim() || "Updated progress",
              progress: averageProgress,
            },
          },
        },
      })
      .catch((updateError) => {
        console.error("Failed to update objective progress:", {
          message: updateError.message,
          stack: updateError.stack,
          code: updateError.code,
          meta: updateError.meta,
        });
        throw updateError;
      });
    console.log(
      "Updated objective progress in database:",
      updatedObjective.progress
    );

    res.status(200).json(updatedKeyResult);
  } catch (error) {
    console.error("Update key result progress error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      request: {
        body: req.body,
        user: req.user,
      },
    });
    res.status(500).json({
      error: "Failed to update key result progress",
      details: error.message,
      code: error.code,
    });
  }
};
