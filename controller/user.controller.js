import crypto from "crypto";
import cloudinary from "../utils/cloudinary.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { User } from "../models/user.mode.js";
import bcrypt from "bcryptjs";

import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailTrap/email.js";
import { generateToken } from "../utils/generateToken.js";

import dotenv from "dotenv";

dotenv.config();

//MARK:signUp
export const signup = async (req, res) => {
  try {
    const { fullName, email, password, contact } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationCode();

    user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      contact: Number(contact),
      verificationToken: verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    generateToken(req, res, user);

    await sendVerificationEmail(req, res, email, verificationToken, fullName);
    const userWithoutPassword = await User.findOne({ email }).select({
      password: 0,
      verificationToken: 0,
      verificationTokenExpiresAt: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//MARK:Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🚀 ~ login ~ req.body:", req.body);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log("🚀 ~ login ~ isPasswordMatch:", isPasswordMatch);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    if (user.isVerified) {
      generateToken(req, res, user);
    }
    user.lastLogin = new Date();
    await user.save();

    //send user without password
    const userWithoutPassword = await User.findOne({ email }).select(
      "-password"
    );
    return res.status(201).json({
      success: true,
      message: `Welcome back ${user.fullName}`,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//MARK:VerifyEmail
export const verifyEmail = async (req, res) => {
  try {
    const { verificationCode } = req.body;
    const user = await User.findOne({
      verificationToken: verificationCode,
      verificationTokenExpireAt: { $gt: Date.now() },
    }).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpireAt = undefined;
    await user.save();

    //send welcome email
    await sendWelcomeEmail(req, res, user.email, user.fullName);
    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//MARK:Logout
export const logout = async (req, res) => {
  console.log("🚀 ~ logout ~ res:");
  try {
    res.clearCookie("token", {
      domain: "localhost",
      path: "/",
      sameSite: "none", // Allow cross-site cookies
      httpOnly: true,
      secure: true,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//MARK:forgetPassword
export const forgetPassword = async (req, res) => {
  try {
    const { forgetPasswordEmail } = req.body;
    const email = forgetPasswordEmail.email;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exists",
      });
    }
    const resetToken = crypto.randomBytes(40).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); //1 hr

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = resetTokenExpiresAt;
    await user.save();

    //send email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
    );

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//MARK:resetPassword
export const resetpassword = async (req, res) => {
  try {
    // console.log("🚀 ~ resetpassword ~ req.param:", req.param);
    const token = req.params.token;
    const { newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }
    //update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    await user.save();
    //send success reset-email
    await sendResetSuccessEmail(user.email);
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//MARK:checkAuth
export const checkAuth = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//MARK:updateProfile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { fullName, email, address, city, country } = req.body;
    const file = req?.file?.path;

    // upload image on cloudinary
    let cloudinaryRes = "";
    if (file) {
      cloudinaryRes = await cloudinary.uploader.upload(file, {
        quality: "auto",
        fetch_format: "auto",
        resource_type: "auto",
      });
    }
    const profilePictureName = cloudinaryRes.url
      ? cloudinaryRes.url
      : cloudinaryRes;

    const updateData = {
      fullName,
      email,
      address,
      city,
      country,
    };
    if (profilePictureName) updateData.profilePictureName = profilePictureName;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      user,
      message: "profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
