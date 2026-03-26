/**
 * PhonePe Payment Controller — RAW API Reference approach
 *
 * Instead of using the @phonepe-pg/pg-sdk-node SDK (which is a wrapper),
 * we directly call PhonePe's REST APIs using axios. This gives us:
 *  1. Full visibility into every HTTP request/response
 *  2. Easy debugging with console.log at every step
 *  3. No black-box — you see exact URLs, headers, bodies
 *
 * API Flow:
 *  Step 1: POST /v1/oauth/token           → Get O-Bearer auth token
 *  Step 2: POST /checkout/v2/pay           → Create payment order → get redirectUrl
 *  Step 3: User completes payment on PhonePe PayPage (redirect or iframe)
 *  Step 4: GET  /checkout/v2/order/{id}/status → Check payment status
 *  Step 5: POST /payments/v2/refund        → Initiate refund (if needed)
 */

import axios from "axios";
import { randomUUID } from "crypto";
import { Order } from "../models/order.model.js";

// ─── Config ───────────────────────────────────────────────────────────
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = Number(process.env.PHONEPE_CLIENT_VERSION) || 1;

const IS_PRODUCTION = process.env.PHONEPE_ENVIRONMENT === "production";
const BASE_URL = IS_PRODUCTION
  ? "https://api.phonepe.com/apis/pg"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox";

const AUTH_URL = IS_PRODUCTION
  ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
  : `${BASE_URL}/v1/oauth/token`;

const FRONTEND_URL =
  process.env.ENVIRONMENT === "prod"
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL_DEV;

console.log("═══════════════════════════════════════════════════════════");
console.log("🔧 PhonePe Config Loaded:");
console.log(
  "   CLIENT_ID:",
  CLIENT_ID ? `${CLIENT_ID.substring(0, 8)}...` : "❌ MISSING",
);
console.log("   CLIENT_SECRET:", CLIENT_SECRET ? "✅ SET" : "❌ MISSING");
console.log("   CLIENT_VERSION:", CLIENT_VERSION);
console.log("   ENVIRONMENT:", IS_PRODUCTION ? "PRODUCTION" : "SANDBOX");
console.log("   BASE_URL:", BASE_URL);
console.log("   AUTH_URL:", AUTH_URL);
console.log("   FRONTEND_URL:", FRONTEND_URL);
console.log("═══════════════════════════════════════════════════════════");

// ─── Token Cache ──────────────────────────────────────────────────────
// The auth token is valid for a limited time (see expires_at in response).
// We cache it and refresh only when it expires.
let cachedToken = null;
let tokenExpiresAt = 0; // epoch in seconds

/**
 * STEP 1: Generate Authorization Token
 * POST /v1/oauth/token
 * Content-Type: application/x-www-form-urlencoded
 * Body: client_id, client_secret, client_version, grant_type=client_credentials
 * Returns: { access_token, expires_at, token_type: "O-Bearer" }
 */
async function getAuthToken() {
  console.log("\n── STEP 1: getAuthToken() ──────────────────────────────");
  console.log("📌 Checking cached token...");
  console.log("   cachedToken exists:", !!cachedToken);
  console.log(
    "   tokenExpiresAt:",
    tokenExpiresAt,
    "(" + new Date(tokenExpiresAt * 1000).toISOString() + ")",
  );
  console.log("   currentTime:", Math.floor(Date.now() / 1000));

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() / 1000 < tokenExpiresAt - 60) {
    console.log("✅ Using cached token (still valid)");
    return cachedToken;
  }

  console.log("🔄 Token expired or missing, requesting new one...");
  console.log("📤 POST", AUTH_URL);

  const requestBody = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    client_version: String(CLIENT_VERSION),
    grant_type: "client_credentials",
  });

  console.log("📤 Request body (form-urlencoded):");
  console.log("   client_id:", CLIENT_ID);
  console.log("   client_version:", CLIENT_VERSION);
  console.log("   grant_type: client_credentials");
  console.log("   client_secret: [HIDDEN]");

  const { data } = await axios.post(AUTH_URL, requestBody.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  console.log("📥 Auth response received:");
  console.log(
    "   access_token:",
    data.access_token ? `${data.access_token.substring(0, 30)}...` : "❌ NONE",
  );
  console.log("   token_type:", data.token_type);
  console.log("   issued_at:", data.issued_at);
  console.log("   expires_at:", data.expires_at);
  console.log("   session_expires_at:", data.session_expires_at);

  cachedToken = data.access_token;
  tokenExpiresAt = data.expires_at || Date.now() / 1000 + 3600;

  console.log("✅ Token cached successfully");
  return cachedToken;
}

// ─── INITIATE PAYMENT ─────────────────────────────────────────────────
/**
 * STEP 2: Create Payment
 * POST {BASE_URL}/checkout/v2/pay
 * Header: Authorization: O-Bearer <token>
 * Body: { merchantOrderId, amount (paisa), paymentFlow, metaInfo }
 * Returns: { orderId, state: "PENDING", redirectUrl }
 */
//MARK:initiatePayment
export const initiatePayment = async (req, res) => {
  try {
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║          INITIATE PAYMENT — STARTED                 ║");
    console.log("╚══════════════════════════════════════════════════════╝");

    // Check config
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.log("❌ PhonePe credentials not configured");
      return res
        .status(500)
        .json({ success: false, message: "Payment gateway not configured" });
    }

    // Log incoming request from frontend
    const { restaurant, deliveryDetails, cartItems, totalAmount } = req.body;
    console.log("\n📦 Request from frontend (req.body):");
    console.log("   restaurant:", restaurant);
    console.log(
      "   deliveryDetails:",
      JSON.stringify(deliveryDetails, null, 2),
    );
    console.log("   cartItems:", JSON.stringify(cartItems, null, 2));
    console.log("   totalAmount:", totalAmount);
    console.log("   userId (req.id):", req.id);

    if (
      !restaurant ||
      !deliveryDetails ||
      !cartItems ||
      cartItems.length === 0
    ) {
      console.log("❌ Validation failed — missing fields");
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Create order in MongoDB
    console.log("\n💾 Creating order in MongoDB...");
    const order = await Order.create({
      user: req.id,
      restaurant,
      deliveryDetails,
      cartItems,
      totalAmount: Number(totalAmount),
      status: "pending",
      paymentStatus: "pending",
    });
    console.log("✅ Order created in DB:");
    console.log("   order._id:", order._id.toString());
    console.log("   order.totalAmount:", order.totalAmount);
    console.log("   order.status:", order.status);
    console.log("   order.paymentStatus:", order.paymentStatus);

    // Prepare PhonePe payment request
    const merchantOrderId = order._id.toString();
    const amountInPaise = Math.round(Number(totalAmount) * 100);
    const redirectUrl = `${FRONTEND_URL}/payment/verify?orderId=${merchantOrderId}`;

    console.log("\n🔢 Payment calculation:");
    console.log("   merchantOrderId:", merchantOrderId);
    console.log("   totalAmount (₹):", totalAmount);
    console.log("   amountInPaise:", amountInPaise);
    console.log("   redirectUrl:", redirectUrl);

    // Get auth token (Step 1)
    const token = await getAuthToken();

    // Build the Create Payment request body (Step 2)
    const paymentRequestBody = {
      merchantOrderId,
      amount: amountInPaise,
      expireAfter: 120, // 2 minutes
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: `Payment for order ${merchantOrderId}`,
        merchantUrls: {
          redirectUrl,
        },
      },
      metaInfo: {
        udf1: merchantOrderId,
        udf2: req.id,
        udf3: restaurant,
      },
    };

    const payUrl = `${BASE_URL}/checkout/v2/pay`;

    console.log("\n── STEP 2: Create Payment ─────────────────────────────");
    console.log("📤 POST", payUrl);
    console.log("📤 Headers:");
    console.log("   Content-Type: application/json");
    console.log(
      "   Authorization: O-Bearer",
      token ? `${token.substring(0, 30)}...` : "MISSING",
    );
    console.log("📤 Request Body:");
    console.log(JSON.stringify(paymentRequestBody, null, 2));

    const { data: phonepeResponse } = await axios.post(
      payUrl,
      paymentRequestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${token}`,
        },
      },
    );

    console.log("\n📥 PhonePe Create Payment response:");
    console.log(JSON.stringify(phonepeResponse, null, 2));
    console.log("   orderId:", phonepeResponse.orderId);
    console.log("   state:", phonepeResponse.state);
    console.log("   redirectUrl:", phonepeResponse.redirectUrl);

    // Save PhonePe orderId to our DB
    if (phonepeResponse.orderId) {
      order.phonepeOrderId = phonepeResponse.orderId;
      await order.save();
      console.log("💾 Saved phonepeOrderId to DB:", phonepeResponse.orderId);
    }

    console.log("\n✅ Sending response back to frontend:");
    console.log(
      "   { success: true, redirectUrl:",
      phonepeResponse.redirectUrl,
      ", orderId:",
      order._id,
      "}",
    );

    return res.status(200).json({
      success: true,
      redirectUrl: phonepeResponse.redirectUrl,
      orderId: order._id,
    });
  } catch (error) {
    console.error("\n❌ initiatePayment ERROR:");
    console.error("   message:", error.message);
    if (error.response) {
      console.error("   HTTP status:", error.response.status);
      console.error(
        "   response data:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    return res.status(500).json({ message: "Payment initiation failed" });
  }
};

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────
/**
 * STEP 4: Check Payment Status
 * GET {BASE_URL}/checkout/v2/order/{merchantOrderId}/status
 * Header: Authorization: O-Bearer <token>
 * Returns: { orderId, state: "COMPLETED"|"PENDING"|"FAILED", amount, paymentDetails, metaInfo }
 */
//MARK:verifyPayment
export const verifyPayment = async (req, res) => {
  try {
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║          VERIFY PAYMENT — STARTED                   ║");
    console.log("╚══════════════════════════════════════════════════════╝");

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.log("❌ PhonePe credentials not configured");
      return res
        .status(500)
        .json({ success: false, message: "Payment gateway not configured" });
    }

    const { orderId } = req.query;
    console.log("📌 orderId from query:", orderId);

    if (!orderId) {
      console.log("❌ orderId missing from query");
      return res
        .status(400)
        .json({ success: false, message: "orderId is required" });
    }

    // Find order in DB
    console.log("💾 Looking up order in MongoDB...");
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("❌ Order not found in DB");
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    console.log("✅ Order found:");
    console.log("   order._id:", order._id.toString());
    console.log("   order.paymentStatus:", order.paymentStatus);
    console.log("   order.status:", order.status);

    // Get auth token
    const token = await getAuthToken();

    // Call PhonePe Order Status API
    const merchantOrderId = order._id.toString();
    const statusUrl = `${BASE_URL}/checkout/v2/order/${merchantOrderId}/status`;

    console.log("\n── STEP 4: Check Payment Status ───────────────────────");
    console.log("📤 GET", statusUrl);
    console.log("📤 Headers:");
    console.log("   Content-Type: application/json");
    console.log(
      "   Authorization: O-Bearer",
      token ? `${token.substring(0, 30)}...` : "MISSING",
    );

    const { data: statusResponse } = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      },
    });

    console.log("\n📥 PhonePe Order Status response:");
    console.log(JSON.stringify(statusResponse, null, 2));
    console.log("   state:", statusResponse.state);
    console.log("   orderId:", statusResponse.orderId);
    console.log("   amount:", statusResponse.amount);

    if (statusResponse.paymentDetails) {
      console.log(
        "   paymentDetails count:",
        statusResponse.paymentDetails.length,
      );
      statusResponse.paymentDetails.forEach((pd, i) => {
        console.log(`   paymentDetails[${i}]:`);
        console.log(`     paymentMode: ${pd.paymentMode}`);
        console.log(`     state: ${pd.state}`);
        console.log(`     amount: ${pd.amount}`);
        console.log(`     transactionId: ${pd.transactionId}`);
      });
    }

    if (statusResponse.metaInfo) {
      console.log("   metaInfo:", JSON.stringify(statusResponse.metaInfo));
    }

    // Update order based on state
    const state = statusResponse.state;
    if (state === "COMPLETED") {
      console.log("✅ Payment COMPLETED — updating order");
      order.paymentStatus = "paid";
      order.paymentId = statusResponse.orderId || "";
      order.phonepeOrderId = statusResponse.orderId || "";
      await order.save();
      console.log("💾 Order updated: paymentStatus=paid");

      return res.status(200).json({
        success: true,
        paymentStatus: "paid",
        orderId: order._id,
      });
    } else if (state === "FAILED") {
      console.log("❌ Payment FAILED — cancelling order");
      order.paymentStatus = "failed";
      order.status = "cancelled";
      order.cancelReason = "Payment failed";
      await order.save();
      console.log("💾 Order updated: paymentStatus=failed, status=cancelled");

      return res.status(200).json({
        success: true,
        paymentStatus: "failed",
        orderId: order._id,
      });
    } else {
      console.log("⏳ Payment PENDING — no DB update yet");
      return res.status(200).json({
        success: true,
        paymentStatus: "pending",
        orderId: order._id,
      });
    }
  } catch (error) {
    console.error("\n❌ verifyPayment ERROR:");
    console.error("   message:", error.message);
    if (error.response) {
      console.error("   HTTP status:", error.response.status);
      console.error(
        "   response data:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

// ─── WEBHOOK ──────────────────────────────────────────────────────────
/**
 * PhonePe sends a POST to this endpoint when payment state changes.
 * The webhook body contains the event type and order details.
 * We always respond 200 to prevent retries.
 */
//MARK:paymentWebhook
export const paymentWebhook = async (req, res) => {
  try {
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║          WEBHOOK RECEIVED                           ║");
    console.log("╚══════════════════════════════════════════════════════╝");

    console.log("📥 Headers:");
    console.log(
      "   authorization:",
      req.headers["authorization"] ? "present" : "missing",
    );
    console.log("   content-type:", req.headers["content-type"]);

    console.log("📥 Body:");
    console.log(JSON.stringify(req.body, null, 2));

    // Parse the webhook payload
    const { type, payload } = req.body;
    console.log("   type:", type);
    console.log("   payload:", JSON.stringify(payload, null, 2));

    if (!type || !payload) {
      console.log(
        "⚠️ Webhook body missing type or payload, responding 200 anyway",
      );
      return res.status(200).json({ success: true });
    }

    const merchantOrderId =
      payload.merchantOrderId ||
      payload.originalMerchantOrderId ||
      payload.orderId;
    console.log("   merchantOrderId (extracted):", merchantOrderId);

    if (type === "CHECKOUT_ORDER_COMPLETED" || type === "PG_ORDER_COMPLETED") {
      console.log("✅ Payment completed via webhook — updating order");
      await Order.findByIdAndUpdate(merchantOrderId, {
        paymentStatus: "paid",
        paymentId: payload.orderId || "",
        phonepeOrderId: payload.orderId || "",
      });
      console.log("💾 Order updated: paymentStatus=paid");
    } else if (type === "CHECKOUT_ORDER_FAILED" || type === "PG_ORDER_FAILED") {
      console.log("❌ Payment failed via webhook — cancelling order");
      await Order.findByIdAndUpdate(merchantOrderId, {
        paymentStatus: "failed",
        status: "cancelled",
        cancelReason: "Payment failed",
      });
      console.log("💾 Order updated: paymentStatus=failed, status=cancelled");
    } else if (type === "PG_REFUND_COMPLETED") {
      console.log("💰 Refund completed via webhook — updating order");
      await Order.findByIdAndUpdate(merchantOrderId, {
        paymentStatus: "refunded",
      });
      console.log("💾 Order updated: paymentStatus=refunded");
    } else {
      console.log("ℹ️ Unhandled webhook type:", type);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("\n❌ Webhook ERROR:");
    console.error("   message:", error.message);
    return res.status(200).json({ success: true }); // always 200 to avoid retries
  }
};

// ─── INITIATE REFUND ──────────────────────────────────────────────────
/**
 * STEP 5: Initiate Refund
 * POST {BASE_URL}/payments/v2/refund
 * Header: Authorization: O-Bearer <token>
 * Body: { merchantRefundId, originalMerchantOrderId, amount (paisa) }
 * Returns: { refundId, amount, state: "PENDING" }
 */
//MARK:initiateRefund
export const initiateRefund = async (req, res) => {
  try {
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║          INITIATE REFUND — STARTED                  ║");
    console.log("╚══════════════════════════════════════════════════════╝");

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.log("❌ PhonePe credentials not configured");
      return res
        .status(500)
        .json({ success: false, message: "Payment gateway not configured" });
    }

    const { orderId } = req.params;
    console.log("📌 orderId from params:", orderId);

    const order = await Order.findById(orderId);
    if (!order) {
      console.log("❌ Order not found in DB");
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    console.log("✅ Order found:");
    console.log("   paymentStatus:", order.paymentStatus);
    console.log("   totalAmount:", order.totalAmount);

    if (order.paymentStatus !== "paid") {
      console.log("❌ Cannot refund — payment is not completed");
      return res
        .status(400)
        .json({ success: false, message: "Order payment is not completed" });
    }

    // Get auth token
    const token = await getAuthToken();

    const merchantRefundId = `REFUND-${randomUUID()}`;
    const originalMerchantOrderId = order._id.toString();
    const amountInPaise = Math.round(order.totalAmount * 100);

    const refundRequestBody = {
      merchantRefundId,
      originalMerchantOrderId,
      amount: amountInPaise,
    };

    const refundUrl = `${BASE_URL}/payments/v2/refund`;

    console.log("\n── STEP 5: Initiate Refund ────────────────────────────");
    console.log("📤 POST", refundUrl);
    console.log("📤 Headers:");
    console.log("   Content-Type: application/json");
    console.log(
      "   Authorization: O-Bearer",
      token ? `${token.substring(0, 30)}...` : "MISSING",
    );
    console.log("📤 Request Body:");
    console.log(JSON.stringify(refundRequestBody, null, 2));

    const { data: refundResponse } = await axios.post(
      refundUrl,
      refundRequestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${token}`,
        },
      },
    );

    console.log("\n📥 PhonePe Refund response:");
    console.log(JSON.stringify(refundResponse, null, 2));
    console.log("   refundId:", refundResponse.refundId);
    console.log("   state:", refundResponse.state);

    if (
      refundResponse.state === "COMPLETED" ||
      refundResponse.state === "PENDING"
    ) {
      order.paymentStatus = "refunded";
      await order.save();
      console.log("💾 Order updated: paymentStatus=refunded");
    }

    return res.status(200).json({
      success: true,
      refundState: refundResponse.state,
    });
  } catch (error) {
    console.error("\n❌ initiateRefund ERROR:");
    console.error("   message:", error.message);
    if (error.response) {
      console.error("   HTTP status:", error.response.status);
      console.error(
        "   response data:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    return res.status(500).json({ message: "Refund failed" });
  }
};
