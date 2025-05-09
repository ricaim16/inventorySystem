import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email ? emailRegex.test(email) : true; // Allow null/undefined
};

// Create User (Manager only, no additional managers)
const createUser = async (req, res, next) => {
  try {
    const { FirstName, LastName, username, email, password, role, status } =
      req.body;

    if (!FirstName || !LastName || !username || !password || !role || !status) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (req.user.role !== "MANAGER") {
      return res.status(403).json({ error: "Only managers can create users" });
    }

    const normalizedRole = role.toUpperCase();
    const normalizedStatus = status.toUpperCase();

    const existingUser = await prisma.users.findFirst({
      where: { OR: [{ username }, email ? { email } : {}] },
    });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username already exists" });
      }
      if (email && existingUser.email === email) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.$transaction(async (prisma) => {
      if (normalizedRole === "MANAGER") {
        const managerCount = await prisma.users.count({
          where: { role: "MANAGER" },
        });
        if (managerCount > 0) {
          throw new Error("Only one manager is allowed");
        }
      }

      return prisma.users.create({
        data: {
          FirstName,
          LastName,
          username,
          email: email || null,
          password: hashedPassword,
          role: normalizedRole,
          status: normalizedStatus,
        },
      });
    });

    console.log(`Created User: ${user.username}`);
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        FirstName: user.FirstName,
        LastName: user.LastName,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.log(`Error in createUser: ${error.message}`);
    if (error.message === "Only one manager is allowed") {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
};

// Get All Users (Manager only - employees only)
const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== "MANAGER") {
      return res
        .status(403)
        .json({ error: "Only managers can view all users" });
    }

    const users = await prisma.users.findMany({
      where: { role: "EMPLOYEE" },
      include: { member: true },
    });

    console.log(`Fetched ${users.length} users`);
    res.status(200).json({
      userCount: users.length,
      users: users.map((user) => ({
        id: user.id,
        FirstName: user.FirstName,
        LastName: user.LastName,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        member: user.member,
      })),
    });
  } catch (error) {
    console.log(`Error in getAllUsers: ${error.message}`);
    next(error);
  }
};

// Get User by ID (Manager sees any, employees see self)
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id },
      include: { member: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.role === "EMPLOYEE" && id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only view your own profile" });
    }

    console.log(`Fetched User by ID: ${user.id}`);
    res.status(200).json({
      id: user.id,
      FirstName: user.FirstName,
      LastName: user.FirstName,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      member: user.member,
    });
  } catch (error) {
    console.log(
      `Error in getUserById for ID ${req.params.id}: ${error.message}`
    );
    next(error);
  }
};

// Update User (Manager updates any, employees update self with restrictions)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      FirstName,
      LastName,
      username,
      email,
      password,
      role,
      status,
      oldPassword,
    } = req.body;

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.role === "EMPLOYEE" && id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only update your own account" });
    }

    if (req.user.role === "MANAGER" && id === req.user.id) {
      if (role !== undefined || status !== undefined) {
        return res
          .status(403)
          .json({ error: "Manager cannot update their own role or status" });
      }
    }

    if (
      req.user.role === "MANAGER" &&
      role &&
      role.toUpperCase() === "MANAGER" &&
      id !== req.user.id
    ) {
      const existingManager = await prisma.users.findFirst({
        where: { role: "MANAGER" },
      });
      if (existingManager && existingManager.id !== id) {
        return res.status(403).json({ error: "Only one manager is allowed" });
      }
    }

    if (username && username !== user.username) {
      const existingUser = await prisma.users.findUnique({
        where: { username },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }
    if (email && email !== user.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const existingUser = await prisma.users.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;

    const updateData = {};

    if (req.user.role === "EMPLOYEE") {
      if (FirstName) updateData.FirstName = FirstName;
      if (LastName) updateData.LastName = LastName;
      if (username) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (hashedPassword) {
        if (!oldPassword) {
          return res
            .status(400)
            .json({ error: "Old password is required to update password" });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
          return res
            .status(400)
            .json({ error: "Current password is incorrect" });
        }
        updateData.password = hashedPassword;
      }
    } else if (req.user.role === "MANAGER") {
      if (id === req.user.id) {
        if (FirstName) updateData.FirstName = FirstName;
        if (LastName) updateData.LastName = LastName;
        if (username) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (hashedPassword) {
          if (!oldPassword) {
            return res
              .status(400)
              .json({ error: "Old password is required to update password" });
          }
          const isMatch = await bcrypt.compare(oldPassword, user.password);
          if (!isMatch) {
            return res
              .status(400)
              .json({ error: "Current password is incorrect" });
          }
          updateData.password = hashedPassword;
        }
      } else {
        updateData.FirstName = FirstName ?? user.FirstName;
        updateData.LastName = LastName ?? user.LastName;
        updateData.username = username ?? user.username;
        updateData.email = email !== undefined ? email : user.email;
        if (hashedPassword) updateData.password = hashedPassword;
        updateData.role = role ? role.toUpperCase() : user.role;
        updateData.status = status ? status.toUpperCase() : user.status;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
    });

    const member = await prisma.members.findUnique({ where: { user_id: id } });
    if (member && (FirstName || LastName)) {
      await prisma.members.update({
        where: { id: member.id },
        data: {
          FirstName: updatedUser.FirstName,
          LastName: updatedUser.LastName,
        },
      });
    }

    console.log(`Updated User: ${updatedUser.username}`);
    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        FirstName: updatedUser.FirstName,
        LastName: updatedUser.LastName,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.log(
      `Error in updateUser for ID ${req.params.id}: ${error.message}`
    );
    next(error);
  }
};

// Delete User (Manager only, cannot delete self)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.role !== "MANAGER") {
      return res.status(403).json({ error: "Only managers can delete users" });
    }

    if (id === req.user.id) {
      return res
        .status(403)
        .json({ error: "Manager cannot delete themselves" });
    }

    await prisma.medicines.deleteMany({ where: { createdById: id } });
    await prisma.users.delete({ where: { id } });
    console.log(`Deleted User with ID: ${id}`);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(
      `Error in deleteUser for ID ${req.params.id}: ${error.message}`
    );
    next(error);
  }
};

// Check if an email exists (accessible to managers or authenticated users)
const checkEmail = async (req, res, next) => {
  console.log("Reached checkEmail controller with query:", req.query);
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, username: true, email: true },
    });
    if (user) {
      console.log(`Email found: ${email}`);
      return res.status(200).json({
        exists: true,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } else {
      console.log(`Email not found: ${email}`);
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.log(`Error in checkEmail: ${error.message}`);
    next(error);
  }
};

// Export all functions
export {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  checkEmail,
};
