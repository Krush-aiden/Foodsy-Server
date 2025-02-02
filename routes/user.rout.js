import express from "express";
import {
  checkAuth,
  forgetPassword,
  login,
  logout,
  resetpassword,
  signup,
  updateProfile,
  verifyEmail,
} from "../controller/user.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route("/check-auth").get(isAuthenticated, checkAuth);
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/verify-email").post(verifyEmail);
router.route("/forget-password").post(forgetPassword);
router.route("/reset-password/:token").post(resetpassword);
router
  .route("/profile/update")
  .post(isAuthenticated, upload.single("profilePictureName"), updateProfile);

export default router;
