import { client, sender } from "./mailTrap.js";

import {
  generatePasswordResetEmailHtml,
  generateResetSuccessEmailHtml,
  generateWelcomeEmailHtml,
  htmlContent,
} from "./htmlEmail.js";
import nodemailer from "nodemailer";

import dotenv from "dotenv";

dotenv.config();

export const sendVerificationEmail = async function (
  req,
  res,
  email,
  verificationToken,
  fullName
) {
  try {
    const recipients = email;
    const sendMail = await client.sendMail({
      from: process.env.GMAILUSER, // sender address
      to: recipients, // list of receivers
      subject: "Verify your Email", // Subject line
      html: htmlContent
        .replace("{verificationToken}", verificationToken)
        .replace("{verifyUser}", fullName),
    });
    console.log("Message sent: %s", sendMail.messageId);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    return res.status(500).json({
      message: "Internal server error not able to send email",
    });
  }
};

export const sendWelcomeEmail = async (req, res, email, name) => {
  const recipients = email;
  const htmlContent = generateWelcomeEmailHtml(name);
  try {
    const res = await client.sendMail({
      from: sender,
      to: recipients,
      subject: "Welcome to FoodSy",
      html: htmlContent,
    });
  } catch (error) {
    console.log("🚀 ~ error:", error);
    return res.status(500).json({
      message: "Failed to send Welcome Email",
    });
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  console.log("🚀 ~ sendPasswordResetEmail ~ resetURL:", resetURL);
  console.log("🚀 ~ sendPasswordResetEmail ~ email:", email);
  const recipients = email;
  const htmlContent = generatePasswordResetEmailHtml(resetURL);

  try {
    const res = await client.sendMail({
      from: sender,
      to: recipients,
      subject: "Reset your password",
      html: htmlContent,
    });
  } catch (error) {
    return res.status(500).json({
      message: "failed to Reset your password",
    });
  }
};

export const sendResetSuccessEmail = async (email) => {
  const recipients = email;
  const htmlContent = generateResetSuccessEmailHtml(email);
  try {
    const res = await client.sendMail({
      from: sender,
      to: recipients,
      subject: "Password Reset Successfully",
      html: htmlContent,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send Reset success email",
    });
  }
};
