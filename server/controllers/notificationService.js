import nodemailer from "nodemailer";
import prisma from "../config/db.js";
import cron from "node-cron";
import { getEthiopianTime } from "./salesController.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Verify environment variables
console.log("EMAIL_USER:", process.env.EMAIL_USER || "Not set");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Set" : "Not set");

// Configure nodemailer
const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER, // emuats0@gmail.com
    pass: process.env.EMAIL_PASS, // ovbgycwhnzcqojgm
  },
});

// Test email sending on startup
async function testEmail() {
  try {
    const info = await mailTransporter.sendMail({
      from: `"Yusra Pharmacy" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: "Test Email from Yusra Pharmacy",
      text: "This is a test email to verify Nodemailer configuration.",
    });
    console.log("Test email sent:", info.response);
  } catch (error) {
    console.error("Test email error:", error.message);
  }
}

// Function to get manager's email from database
async function getManagerEmail() {
  try {
    const manager = await prisma.users.findFirst({
      where: { role: "MANAGER" },
      select: { email: true },
    });
    if (manager?.email) {
      console.log(`Found manager email: ${manager.email}`);
      return manager.email;
    }
    console.error("No manager email found in database");
    return null;
  } catch (error) {
    console.error("Error fetching manager email:", error.message);
    return null;
  }
}

// Function to send email
function sendNotificationEmail(subject, textMessage, htmlMessage, callback) {
  getManagerEmail()
    .then((managerEmail) => {
      if (!managerEmail) {
        const error = new Error("No manager email available");
        console.error(error.message);
        return callback(error);
      }

      const mailDetails = {
        from: {
          name: "Yusra Pharmacy",
          address: process.env.EMAIL_USER,
        },
        to: managerEmail,
        subject,
        text: textMessage,
        html: htmlMessage,
      };

      console.log(`Sending email to ${managerEmail} with subject: ${subject}`);
      mailTransporter.sendMail(mailDetails, (err, info) => {
        if (err) {
          console.error(`Error sending email to ${managerEmail}:`, err.message);
          callback(err);
        } else {
          console.log(`Email sent to ${managerEmail}: ${info.response}`);
          callback(null, info);
        }
      });
    })
    .catch((error) => {
      console.error("Error getting manager email:", error.message);
      callback(error);
    });
}

// Function to check low stock
async function checkLowStock() {
  const LOW_STOCK_THRESHOLD = 10;
  try {
    console.log("Checking low stock medicines...");
    const lowStockMedicines = await prisma.medicines.findMany({
      where: { quantity: { lte: LOW_STOCK_THRESHOLD } },
      include: {
        supplier: { select: { supplier_name: true } },
        category: true,
      },
    });

    console.log(`Found ${lowStockMedicines.length} low stock medicines`);
    if (lowStockMedicines.length > 0) {
      const textMessage =
        `Yusra Pharmacy\n` +
        `Low Stock Alert\n` +
        `Dear Manager,\n\n` +
        `The following medicines are low in stock (≤ ${LOW_STOCK_THRESHOLD} units):\n\n` +
        `No. | Medicine Name | Batch Number | Expire Date | Quantity | Category | Supplier | Status\n` +
        `------------------------------------------------------------\n` +
        lowStockMedicines
          .map(
            (med, index) =>
              `${index + 1} | ${med.medicine_name} | ${
                med.batch_number || "Not Assigned"
              } | ${med.expire_date?.toISOString().split("T")[0] || "N/A"} | ${
                med.quantity
              } | ${med.category?.name || "N/A"} | ${
                med.supplier?.supplier_name || "Not Assigned"
              } | Low Stock`
          )
          .join("\n") +
        `\n\nPlease restock these items.\n\nBest regards,\nYusra Pharmacy`;

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; background-color: #f5f6fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">Yusra Pharmacy</h2>
          <h3 style="color: #e74c3c; text-align: center;">Low Stock Alert</h3>
          <p style="color: #34495e;">Dear Manager,</p>
          <p style="color: #34495e;">The following medicines are low in stock (≤ ${LOW_STOCK_THRESHOLD} units):</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #3498db; color: #ffffff;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">No.</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Medicine Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Batch Number</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Expire Date</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Quantity</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Category</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Supplier</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockMedicines
                .map(
                  (med, index) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      index + 1
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.medicine_name
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.batch_number || "Not Assigned"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.expire_date?.toISOString().split("T")[0] || "N/A"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.quantity
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.category?.name || "N/A"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.supplier?.supplier_name || "Not Assigned"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px; color: #e74c3c;">Low Stock</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          <p style="color: #34495e;">Please restock these items.</p>
          <p style="color: #34495e; margin-top: 20px;">Best regards,<br>Yusra Pharmacy</p>
          <hr style="border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">This is an automated email. Do not reply.</p>
        </div>
      `;

      sendNotificationEmail(
        "Low Stock Alert",
        textMessage,
        htmlMessage,
        (err) => {
          if (err) {
            console.error("Failed to send low stock email:", err.message);
          } else {
            console.log("Low stock email sent successfully");
          }
        }
      );
    } else {
      console.log("No low stock medicines found");
    }
  } catch (error) {
    console.error("Error checking low stock:", error.message);
  }
}

// Function to check expiring medicines
async function checkExpiringMedicines() {
  const now = getEthiopianTime();
  if (!(now instanceof Date) || isNaN(now)) {
    console.error("Invalid date from getEthiopianTime:", now);
    return;
  }
  const thresholds = [
    { weeks: 4, label: "4 weeks" },
    { weeks: 2, label: "2 weeks" },
    { weeks: 0, label: "expired" },
  ];

  try {
    console.log("Checking expiring medicines...");
    const allExpiringMedicines = [];
    for (const threshold of thresholds) {
      const thresholdDate = new Date(
        now.getTime() + threshold.weeks * 7 * 24 * 60 * 60 * 1000
      );

      const whereClause =
        threshold.weeks === 0
          ? { expire_date: { lte: now } }
          : {
              expire_date: {
                gt: now,
                lte: thresholdDate,
              },
            };

      const expiringMedicines = await prisma.medicines.findMany({
        where: whereClause,
        include: {
          supplier: { select: { supplier_name: true } },
          category: true,
        },
      });
      allExpiringMedicines.push(
        ...expiringMedicines.map((med) => ({
          ...med,
          status:
            threshold.weeks === 0
              ? "Expired"
              : `Expiring in ${threshold.label}`,
          batch_number: med.batch_number || "Not Assigned",
        }))
      );
    }

    console.log(
      `Found ${allExpiringMedicines.length} expiring/expired medicines`
    );
    if (allExpiringMedicines.length > 0) {
      const textMessage =
        `Yusra Pharmacy\n` +
        `Expiration Alert\n` +
        `Dear Manager,\n\n` +
        `The following medicines are expiring or have expired:\n\n` +
        `No. | Medicine Name | Batch Number | Expire Date | Quantity | Category | Supplier | Expiration Status\n` +
        `------------------------------------------------------------\n` +
        allExpiringMedicines
          .map(
            (med, index) =>
              `${index + 1} | ${med.medicine_name} | ${
                med.batch_number || "Not Assigned"
              } | ${med.expire_date?.toISOString().split("T")[0] || "N/A"} | ${
                med.quantity
              } | ${med.category?.name || "N/A"} | ${
                med.supplier?.supplier_name || "Not Assigned"
              } | ${med.status}`
          )
          .join("\n") +
        `\n\nPlease take action to manage these expiration dates.\n\nBest regards,\nYusra Pharmacy`;

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; background-color: #f5f6fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">Yusra Pharmacy</h2>
          <h3 style="color: #e74c3c; text-align: center;">Expiration Alert</h3>
          <p style="color: #34495e;">Dear Manager,</p>
          <p style="color: #34495e;">The following medicines are expiring or have expired:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #3498db; color: #ffffff;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">No.</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Medicine Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Batch Number</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Expire Date</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Quantity</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Category</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Supplier</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Expiration Status</th>
              </tr>
            </thead>
            <tbody>
              ${allExpiringMedicines
                .map(
                  (med, index) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      index + 1
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.medicine_name
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.batch_number || "Not Assigned"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.expire_date?.toISOString().split("T")[0] || "N/A"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.quantity
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.category?.name || "N/A"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      med.supplier?.supplier_name || "Not Assigned"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px; color: ${
                      med.status === "Expired" ? "#e74c3c" : "#f39c12"
                    };">${med.status}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          <p style="color: #34495e;">Please take action to manage these expiration dates.</p>
          <p style="color: #34495e; margin-top: 20px;">Best regards,<br>Yusra Pharmacy</p>
          <hr style="border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">This is an automated email. Do not reply.</p>
        </div>
      `;

      sendNotificationEmail(
        "Expiration Alert",
        textMessage,
        htmlMessage,
        (err) => {
          if (err) {
            console.error("Failed to send expiration email:", err.message);
          } else {
            console.log("Expiration email sent successfully");
          }
        }
      );
    } else {
      console.log("No expiring or expired medicines found");
    }
  } catch (error) {
    console.error("Error checking expiring medicines:", error.message);
  }
}

// Function to handle stock updates after sales
async function handleSaleNotification(medicineId, quantitySold, medicineName) {
  try {
    console.log(`Handling sale notification for medicine ID: ${medicineId}`);
    const medicine = await prisma.medicines.findUnique({
      where: { id: medicineId },
      include: {
        supplier: { select: { supplier_name: true } },
        category: true,
      },
    });

    if (!medicine) {
      console.error(`Medicine with ID ${medicineId} not found`);
      return;
    }

    const newQuantity = medicine.quantity - quantitySold;
    console.log(`New quantity for ${medicineName}: ${newQuantity}`);
    if (newQuantity <= 10) {
      const textMessage =
        `Yusra Pharmacy\n` +
        `Low Stock After Sale\n` +
        `Dear Manager,\n\n` +
        `A recent sale has updated the stock level:\n\n` +
        `No. | Medicine Name | Batch Number | Expire Date | Quantity | Category | Supplier | Status\n` +
        `------------------------------------------------------------\n` +
        `1 | ${medicineName} | ${medicine.batch_number || "Not Assigned"} | ${
          medicine.expire_date?.toISOString().split("T")[0] || "N/A"
        } | ${newQuantity} | ${medicine.category?.name || "N/A"} | ${
          medicine.supplier?.supplier_name || "Not Assigned"
        } | Low Stock\n\n` +
        `The stock is now at or below the threshold (10 units).\n\nBest regards,\nYusra Pharmacy`;

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; background-color: #f5f6fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">Yusra Pharmacy</h2>
          <h3 style="color: #e74c3c; text-align: center;">Low Stock After Sale</h3>
          <p style="color: #34495e;">Dear Manager,</p>
          <p style="color: #34495e;">A recent sale has updated the stock level:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #3498db; color: #ffffff;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">No.</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Medicine Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Batch Number</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Expire Date</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Quantity</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Category</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Supplier</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">1</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${medicineName}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${
                  medicine.batch_number || "Not Assigned"
                }</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${
                  medicine.expire_date?.toISOString().split("T")[0] || "N/A"
                }</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${newQuantity}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${
                  medicine.category?.name || "N/A"
                }</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${
                  medicine.supplier?.supplier_name || "Not Assigned"
                }</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: #e74c3c;">Low Stock</td>
              </tr>
            </tbody>
          </table>
          <p style="color: #34495e;">The stock is now at or below the threshold (10 units).</p>
          <p style="color: #34495e; margin-top: 20px;">Best regards,<br>Yusra Pharmacy</p>
          <hr style="border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">This is an automated email. Do not reply.</p>
        </div>
      `;

      sendNotificationEmail(
        "Low Stock After Sale",
        textMessage,
        htmlMessage,
        (err) => {
          if (err) {
            console.error(
              "Failed to send sale notification email:",
              err.message
            );
          } else {
            console.log("Sale notification email sent successfully");
          }
        }
      );
    }
  } catch (error) {
    console.error("Error handling sale notification:", error.message);
  }
}

// Function to check unpaid supplier credits
async function checkSupplierCredits() {
  const now = getEthiopianTime();
  if (!(now instanceof Date) || isNaN(now)) {
    console.error("Invalid date from getEthiopianTime:", now);
    return;
  }
  const thresholds = [
    { weeks: 4, label: "4 weeks", type: "CREDIT_4W" },
    { weeks: 3, label: "3 weeks", type: "CREDIT_3W" },
    { weeks: 2, label: "2 weeks", type: "CREDIT_2W" },
  ];

  try {
    console.log("Checking unpaid supplier credits...");
    const allUnpaidCredits = [];
    for (const threshold of thresholds) {
      const thresholdDate = new Date(
        now.getTime() - threshold.weeks * 7 * 24 * 60 * 60 * 1000
      );
      console.log(
        `Threshold date for ${threshold.label} overdue:`,
        thresholdDate
      );

      const unpaidCredits = await prisma.supplierCredits.findMany({
        where: {
          payment_status: { in: ["UNPAID", "PARTIALLY_PAID"] },
          credit_date: { lte: thresholdDate },
        },
        include: { supplier: true },
      });

      allUnpaidCredits.push(
        ...unpaidCredits.map((credit) => ({
          ...credit,
          overduePeriod: threshold.label,
          notificationType: threshold.type,
        }))
      );
    }

    console.log(`Found ${allUnpaidCredits.length} unpaid supplier credits`);
    if (allUnpaidCredits.length > 0) {
      const textMessage =
        `Yusra Pharmacy\n` +
        `Unpaid Supplier Credits Alert\n` +
        `Dear Manager,\n\n` +
        `The following supplier credits are unpaid and overdue:\n\n` +
        `No. | Supplier Name | Credit Amount | Paid Amount | Unpaid Amount | Credit Date | Overdue Period | Status\n` +
        `------------------------------------------------------------\n` +
        allUnpaidCredits
          .map(
            (credit, index) =>
              `${index + 1} | ${credit.supplier?.supplier_name || "N/A"} | ${
                credit.credit_amount
              } | ${credit.paid_amount || 0} | ${credit.unpaid_amount || 0} | ${
                credit.credit_date?.toISOString().split("T")[0] || "N/A"
              } | ${credit.overduePeriod} | ${credit.payment_status}`
          )
          .join("\n") +
        `\n\nPlease settle these amounts.\n\nBest regards,\nYusra Pharmacy`;

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; background-color: #f5f6fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">Yusra Pharmacy</h2>
          <h3 style="color: #e74c3c; text-align: center;">Unpaid Supplier Credits Alert</h3>
          <p style="color: #34495e;">Dear Manager,</p>
          <p style="color: #34495e;">The following supplier credits are unpaid and overdue:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #3498db; color: #ffffff;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">No.</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Supplier Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Credit Amount</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Paid Amount</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Unpaid Amount</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Credit Date</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Overdue Period</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${allUnpaidCredits
                .map(
                  (credit, index) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      index + 1
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.supplier?.supplier_name || "N/A"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.credit_amount
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.paid_amount || 0
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.unpaid_amount || 0
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.credit_date?.toISOString().split("T")[0] || "N/A"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.overduePeriod
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px; color: ${
                      credit.payment_status === "UNPAID" ? "#e74c3c" : "#f39c12"
                    };">${credit.payment_status}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          <p style="color: #34495e;">Please settle these amounts.</p>
          <p style="color: #34495e; margin-top: 20px;">Best regards,<br>Yusra Pharmacy</p>
          <hr style="border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">This is an automated email. Do not reply.</p>
        </div>
      `;

      sendNotificationEmail(
        "Unpaid Supplier Credits Alert",
        textMessage,
        htmlMessage,
        (err) => {
          if (err) {
            console.error(
              "Failed to send supplier credits email:",
              err.message
            );
          } else {
            console.log("Supplier credits email sent successfully");
          }
        }
      );
    } else {
      console.log("No unpaid supplier credits found");
    }
  } catch (error) {
    console.error("Error checking supplier credits:", error.message);
  }
}

// Function to check unpaid customer credits
async function checkCustomerCredits() {
  const now = getEthiopianTime();
  if (!(now instanceof Date) || isNaN(now)) {
    console.error("Invalid date from getEthiopianTime:", now);
    return;
  }
  const thresholds = [
    { weeks: 4, label: "4 weeks", type: "CREDIT_4W" },
    { weeks: 3, label: "3 weeks", type: "CREDIT_3W" },
    { weeks: 2, label: "2 weeks", type: "CREDIT_2W" },
  ];

  try {
    console.log("Checking unpaid customer credits...");
    const allUnpaidCredits = [];
    for (const threshold of thresholds) {
      const thresholdDate = new Date(
        now.getTime() - threshold.weeks * 7 * 24 * 60 * 60 * 1000
      );
      console.log(
        `Threshold date for ${threshold.label} overdue:`,
        thresholdDate
      );

      const unpaidCredits = await prisma.customerCredit.findMany({
        where: {
          status: { in: ["UNPAID", "PARTIALLY_PAID"] },
          credit_date: { lte: thresholdDate },
        },
        include: { customer: true },
      });

      allUnpaidCredits.push(
        ...unpaidCredits.map((credit) => ({
          ...credit,
          overduePeriod: threshold.label,
          notificationType: threshold.type,
        }))
      );
    }

    console.log(`Found ${allUnpaidCredits.length} unpaid customer credits`);
    if (allUnpaidCredits.length > 0) {
      const textMessage =
        `Yusra Pharmacy\n` +
        `Unpaid Customer Credits Alert\n` +
        `Dear Manager,\n\n` +
        `The following customer credits are unpaid and overdue:\n\n` +
        `No. | Customer Name | Credit Amount | Paid Amount | Unpaid Amount | Credit Date | Overdue Period | Status\n` +
        `------------------------------------------------------------\n` +
        allUnpaidCredits
          .map(
            (credit, index) =>
              `${index + 1} | ${credit.customer?.name || "N/A"} | ${
                credit.credit_amount
              } | ${credit.paid_amount || 0} | ${credit.unpaid_amount || 0} | ${
                credit.credit_date?.toISOString().split("T")[0] || "N/A"
              } | ${credit.overduePeriod} | ${credit.status}`
          )
          .join("\n") +
        `\n\nPlease collect these amounts.\n\nBest regards,\nYusra Pharmacy`;

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; background-color: #f5f6fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">Yusra Pharmacy</h2>
          <h3 style="color: #e74c3c; text-align: center;">Unpaid Customer Credits Alert</h3>
          <p style="color: #34495e;">Dear Manager,</p>
          <p style="color: #34495e;">The following customer credits are unpaid and overdue:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #3498db; color: #ffffff;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">No.</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Customer Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Credit Amount</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Paid Amount</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Unpaid Amount</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Credit Date</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Overdue Period</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${allUnpaidCredits
                .map(
                  (credit, index) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      index + 1
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.customer?.name || "N/A"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.credit_amount
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.paid_amount || 0
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.unpaid_amount || 0
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.credit_date?.toISOString().split("T")[0] || "N/A"
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${
                      credit.overduePeriod
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 12px; color: ${
                      credit.status === "UNPAID" ? "#e74c3c" : "#f39c12"
                    };">${credit.status}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          <p style="color: #34495e;">Please collect these amounts.</p>
          <p style="color: #34495e; margin-top: 20px;">Best regards,<br>Yusra Pharmacy</p>
          <hr style="border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #7f8c8d; text-align: center;">This is an automated email. Do not reply.</p>
        </div>
      `;

      sendNotificationEmail(
        "Unpaid Customer Credits Alert",
        textMessage,
        htmlMessage,
        (err) => {
          if (err) {
            console.error(
              "Failed to send customer credits email:",
              err.message
            );
          } else {
            console.log("Customer credits email sent successfully");
          }
        }
      );
    } else {
      console.log("No unpaid customer credits found");
    }
  } catch (error) {
    console.error("Error checking customer credits:", error.message);
  }
}

// Function to initialize test data
async function initializeTestData() {
  try {
    // Check for existing manager
    const manager = await prisma.users.findFirst({
      where: { role: "MANAGER" },
    });
    if (!manager) {
      await prisma.users.create({
        data: {
          email: process.env.EMAIL_USER, // Use EMAIL_USER for testing
          role: "MANAGER",
          name: "Test Manager",
        },
      });
      console.log("Test manager created");
    }

    // Check for supplier
    let supplier = await prisma.suppliers.findFirst();
    if (!supplier) {
      supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "Test Supplier",
          contact_info: "+251912345678",
          location: "Addis Ababa",
        },
      });
      console.log("Test supplier created");
    }

    // Check for low stock medicines
    const lowStock = await prisma.medicines.findFirst({
      where: { quantity: { lte: 10 } },
    });
    if (!lowStock) {
      await prisma.medicines.create({
        data: {
          medicine_name: "Test Medicine",
          quantity: 5,
          expire_date: new Date(),
          batch_number: "BATCH001",
          supplier: { connect: { id: supplier.id } },
        },
      });
      console.log("Test low stock medicine created");
    }

    // Check for expiring medicines
    const expiring = await prisma.medicines.findFirst({
      where: { expire_date: { lte: new Date() } },
    });
    if (!expiring) {
      await prisma.medicines.create({
        data: {
          medicine_name: "Test Expiring Medicine",
          quantity: 20,
          expire_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          batch_number: "BATCH002",
          supplier: { connect: { id: supplier.id } },
        },
      });
      console.log("Test expiring medicine created");
    }

    // Check for customer
    let customer = await prisma.customers.findFirst();
    if (!customer) {
      customer = await prisma.customers.create({
        data: {
          name: "Test Customer",
          phone: "+251912345679",
          address: "Addis Ababa",
          status: "ACTIVE",
        },
      });
      console.log("Test customer created");
    }

    // Check for unpaid supplier credit
    const unpaidSupplierCredit = await prisma.supplierCredits.findFirst({
      where: { payment_status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
    });
    if (!unpaidSupplierCredit) {
      await prisma.supplierCredits.create({
        data: {
          supplier_id: supplier.id,
          credit_amount: 1000,
          paid_amount: 0,
          unpaid_amount: 1000,
          payment_status: "UNPAID",
          credit_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
        },
      });
      console.log("Test unpaid supplier credit created");
    }

    // Check for unpaid customer credit
    const unpaidCustomerCredit = await prisma.customerCredit.findFirst({
      where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
    });
    if (!unpaidCustomerCredit) {
      await prisma.customerCredit.create({
        data: {
          customer_id: customer.id,
          credit_amount: 500,
          paid_amount: 0,
          unpaid_amount: 500,
          status: "UNPAID",
          credit_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
        },
      });
      console.log("Test unpaid customer credit created");
    }
  } catch (error) {
    console.error("Error initializing test data:", error.message);
  }
}

// Schedule notifications
cron.schedule(
  "0 1 * * *", // Runs daily at 1:00 AM EAT
  async () => {
    console.log("Running scheduled notification checks...");
    await checkLowStock();
    await checkExpiringMedicines();
    await checkSupplierCredits();
    await checkCustomerCredits();
  },
  {
    timezone: "Africa/Addis_Ababa",
  }
);

// Run initialization and test email on startup
async function start() {
  await initializeTestData();
  await testEmail();
  // Run checks immediately for testing
  await checkLowStock();
  await checkExpiringMedicines();
  await checkSupplierCredits();
  await checkCustomerCredits();
}
start();

// Export functions
export const notificationService = {
  checkLowStock,
  checkExpiringMedicines,
  checkSupplierCredits,
  checkCustomerCredits,
  sendNotificationEmail,
  handleSaleNotification,
};
