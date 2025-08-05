import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";


export const seedDatabase = async () => {
  try {
    const existingManager = await prisma.Users.findFirst({
      where: { role: "MANAGER" },
    });

    if (existingManager) {
      console.warn(
        `Manager account already exists (username: ${existingManager.username}), skipping database seeding.`
      );
      return; 
    }


    const managerData = {
      FirstName: "Sample",
      LastName: "Manager",
      username: "Admin",
      email: "admin@example.com", 
      password: "1234",
      role: "MANAGER",
    };



    const hashedPassword = await hashPassword(managerData.password);
    const manager = await prisma.Users.create({
      data: {
        FirstName: managerData.FirstName,
        LastName: managerData.LastName,
        username: managerData.username,
        email: managerData.email, 
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
