import prisma from "../config/db.js";
import { comparePassword } from "../utils/hashPassword.js";
import jwt from "jsonwebtoken";

// Login (Both manager and employee)
export const login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ error: "Username, password, and role are required" });
    }

    // Normalize and validate role
    const requestedRole = role.toUpperCase();
    if (!["MANAGER", "EMPLOYEE"].includes(requestedRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await prisma.users.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if the requested role matches the user's role in the database
    if (user.role !== requestedRole) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ error: "Account is inactive" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`Login successful for user: ${user.username}`); // Fixed: log -> console.log
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.log(`Error in login: ${error.message}`); // Fixed: log -> console.log
    next(error);
  }
};
