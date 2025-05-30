import prisma from "../config/db.js";

function getEthiopianTime(date = new Date()) {
  const utcDate = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
  const etOffset = 3 * 60 * 60 * 1000; // UTC+3 for East Africa Time
  return new Date(utcDate.getTime() + etOffset);
}

export const expireController = {
  getExpiredMedicines: async (req, res) => {
    try {
      const now = getEthiopianTime();
      const expiredMedicines = await prisma.medicines.findMany({
        where: {
          expire_date: { lte: now },
        },
        include: {
          category: true,
          dosage_form: true,
          supplier: true,
          createdBy: { select: { username: true } },
          updatedBy: { select: { username: true } },
        },
      });

      console.log("Expired Medicines:", expiredMedicines);

      const expiredMedicinesWithPrice = expiredMedicines.map((med) => ({
        ...med,
        unit_price: med.unit_price || 10,
        total_price:
          med.total_price || (med.unit_price || 10) * (med.quantity || 0),
      }));

      const totalValue = expiredMedicinesWithPrice.reduce(
        (sum, med) => sum + (med.total_price || 0),
        0
      );

      res.json({ medicines: expiredMedicinesWithPrice, totalValue });
    } catch (error) {
      console.error("Error fetching expired medicines:", error);
      res.status(500).json({
        error: {
          message: "Error fetching expired medicines",
          details: error.message,
          stack: error.stack,
        },
      });
    }
  },

  getExpirationAlerts: async (req, res) => {
    try {
      const now = getEthiopianTime();
      const oneYearFromNow = new Date(
        now.getTime() + 365 * 24 * 60 * 60 * 1000
      );
      const expiringMedicines = await prisma.medicines.findMany({
        where: {
          expire_date: {
            gt: now,
            lte: oneYearFromNow,
          },
        },
        include: {
          category: true,
          dosage_form: true,
          supplier: true,
        },
      });
      res.json(expiringMedicines);
    } catch (error) {
      console.error("Error fetching expiration alerts:", error);
      res.status(500).json({
        error: {
          message: "Error fetching expiration alerts",
          details: error.message,
        },
      });
    }
  },

  generateExpirationReport: async (req, res) => {
    try {
      const { time_period, category, limit = 100, offset = 0 } = req.query;
      const now = getEthiopianTime();
      const oneYearFromNow = new Date(
        now.getTime() + 365 * 24 * 60 * 60 * 1000
      );

      let expiringSoonFilter;
      let expiringSoonDays;
      if (time_period === "30_days") {
        expiringSoonDays = 30;
        expiringSoonFilter = new Date(
          now.getTime() + expiringSoonDays * 24 * 60 * 60 * 1000
        );
      } else if (time_period === "90_days") {
        expiringSoonDays = 90;
        expiringSoonFilter = new Date(
          now.getTime() + expiringSoonDays * 24 * 60 * 60 * 1000
        );
      } else if (time_period === "180_days") {
        expiringSoonDays = 180;
        expiringSoonFilter = new Date(
          now.getTime() + expiringSoonDays * 24 * 60 * 60 * 1000
        );
      } else if (time_period === "1_year") {
        expiringSoonDays = 365;
        expiringSoonFilter = oneYearFromNow;
      } else if (time_period === "all") {
        expiringSoonDays = Infinity;
        expiringSoonFilter = new Date(8640000000000000); // Max date
      } else {
        expiringSoonDays = 365;
        expiringSoonFilter = oneYearFromNow;
      }

      console.log("Query Params:", { time_period, category, limit, offset });
      console.log("Date Range:", { now, oneYearFromNow, expiringSoonFilter });

      const medicines = await prisma.medicines.findMany({
        where: {
          expire_date: {
            lte:
              time_period === "all"
                ? new Date(8640000000000000)
                : oneYearFromNow,
          },
          ...(category && { category: { name: category } }),
        },
        include: {
          category: true,
          supplier: true,
          createdBy: { select: { username: true } },
        },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      });

      console.log("Fetched Medicines:", medicines);

      if (!medicines) {
        throw new Error("No medicines data retrieved from database");
      }

      const medicinesWithPrice = medicines.map((med) => ({
        ...med,
        unit_price: med.unit_price || 10,
        total_price:
          med.total_price || (med.unit_price || 10) * (med.quantity || 0),
      }));

      const expiredMedicines = [];
      const expiringSoonMedicines = [];
      const expiringLaterMedicines = [];

      for (const med of medicinesWithPrice) {
        const expireDate = new Date(med.expire_date);
        if (isNaN(expireDate.getTime())) {
          console.warn(
            `Invalid expire_date for medicine ${med.medicine_name}: ${med.expire_date}`
          );
          continue;
        }
        const daysUntilExpiry = Math.ceil(
          (expireDate - now) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry <= 0) {
          expiredMedicines.push(med);
        } else if (daysUntilExpiry <= expiringSoonDays) {
          expiringSoonMedicines.push(med);
        } else if (daysUntilExpiry <= 365) {
          expiringLaterMedicines.push(med);
        }
      }

      const totalValue = expiredMedicines.reduce(
        (sum, med) => sum + (med.total_price || 0),
        0
      );

      const report = {
        generatedAt: now,
        expiredMedicines,
        expiringSoonMedicines,
        expiringLaterMedicines,
        expiringSoonCount: expiringSoonMedicines.length,
        expiredCount: expiredMedicines.length,
        expiringLaterCount: expiringLaterMedicines.length,
        totalValue,
        expiringSoonDays: isFinite(expiringSoonDays) ? expiringSoonDays : 365,
      };

      console.log("Generated Report:", report);
      res.json(report);
    } catch (error) {
      console.error("Error generating expiration report:", error);
      res.status(500).json({
        error: {
          message: "Error generating expiration report",
          details: error.message,
          stack: error.stack,
        },
      });
    }
  },
};
