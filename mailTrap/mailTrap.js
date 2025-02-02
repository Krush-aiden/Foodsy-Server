import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config();

export const client = nodemailer.createTransport({
  service: "gmail",
  host: process.env.SMTP,
  port: process.env.HOST,
  secure: false,

  auth: {
    user: process.env.GMAILUSER,
    pass: process.env.PASS,
  },
});

export const sender = {
  name: "FoodSy",
  email: process.env.GMAILUSER,
};
