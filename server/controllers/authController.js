import prisma from "../config/db.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000);
};

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Updated to use environment variable
    pass: process.env.EMAIL_PASS, // Updated to use environment variable
  },
});

// Login (Both manager and employee)
export const login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ error: "Username, password, and role are required" });
    }

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

    if (user.role !== requestedRole) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ error: "Account is inactive" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    console.log(`Login successful for user: ${user.username}`);
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
    console.log(`Error in login: ${error.message}`);
    next(error);
  }
};

// Forgot Password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log("Received email:", email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ error: "User not found" });
    }

    const otp = generateOTP();
    console.log("Generated OTP:", otp);
    await prisma.users.update({ where: { id: user.id }, data: { otp } });
    console.log("OTP saved to database for user:", user.id);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP for password reset is ${otp}`,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          reject(error);
        } else {
          console.log("Email sent:", info.response);
          resolve(info);
        }
      });
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log(`Error in forgotPassword: ${error.message}`);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

// Verify OTP
export const verifyOtp = async (req, res, next) => {
  try {
    const { otp, email } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const user = await prisma.users.findFirst({
      where: {
        email,
        otp,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid OTP or email" });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { otp: null },
    });

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log(`Error in verifyOtp: ${error.message}`);
    next(error);
  }
};

// Update Password
export const updatePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(`Error in updatePassword: ${error.message}`);
    next(error);
  }
};
