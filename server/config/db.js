import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const dbConnect = async () => {
  try {
    await prisma.$connect();
    console.log("Prisma client connected to the database");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    throw error;
  }
};
export default prisma;
