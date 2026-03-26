import express from "express";
import {
  initiatePayment,
  verifyPayment,
  paymentWebhook,
  initiateRefund,
} from "../controller/payment.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/initiate").post(isAuthenticated, initiatePayment);
router.route("/verify").get(isAuthenticated, verifyPayment);
router.route("/webhook").post(paymentWebhook);
router.route("/refund/:orderId").post(isAuthenticated, initiateRefund);

export default router;
