import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";

export const seedDatabase = async () => {
  try {
    // Check if any manager exists in the database
    const existingManager = await prisma.Users.findFirst({
      where: { role: "MANAGER" },
    });

    if (existingManager) {
      console.warn(
        `Manager account already exists (username: ${existingManager.username}), skipping database seeding.`
      );
      return; // Exit early if a manager already exists
    }

    const managerData = {
      FirstName: "Sample",
      LastName: "Manager",
      username: "Admin",
      email: "admin@example.com", // Add email
      password: "1234", // Match the password used in login
      role: "MANAGER",
    };

    const hashedPassword = await hashPassword(managerData.password);
    const manager = await prisma.Users.create({
      data: {
        FirstName: managerData.FirstName,
        LastName: managerData.LastName,
        username: managerData.username,
        email: managerData.email, // Include email
        password: hashedPassword,
        role: managerData.role,
        status: "ACTIVE",
      },
    });

    console.info(
      `Sample manager account created: ${managerData.username} (email: ${managerData.email})`
    );
  } catch (error) {
    console.error("Failed to seed database: " + error.message);
    throw error;
  }
};
