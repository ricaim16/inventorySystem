import { dbConnect } from "./config/db.js";
import { seedDatabase } from "./prisma/seed.js";
import app from "./app.js";

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await dbConnect();
    console.info("Database connected successfully");

    await seedDatabase();
    console.info("Database seeding completed");

    app.listen(PORT, () => {
      console.info(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Application startup failed: " + err.message);
    process.exit(1);
  }
};

startServer();
