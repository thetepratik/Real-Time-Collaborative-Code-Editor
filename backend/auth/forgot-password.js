import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

/**
 * POST /auth/forgot-password
 * Body: { email }
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Always return same message (security)
    if (!user) {
      return res.json({ message: "If user exists, OTP sent to email" });
    }

    // 🔢 Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    user.resetOTP = otp;
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // 📧 Email transport (ADMIN EMAIL)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // admin email
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    // 📤 Send OTP email
    await transporter.sendMail({
      from: `"Realtime Editor" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset</h2>
          <p>Your 6-digit OTP is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code is valid for <b>10 minutes</b>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("❌ Forgot password error:", error.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

export default router;
