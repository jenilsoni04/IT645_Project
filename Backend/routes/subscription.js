const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  createOrder,
  verifyPayment,
  getSubscriptionStatus,
} = require("../controllers/subscriptioncontroller");

router.post("/create-order", authMiddleware, createOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);
router.get("/status/:userId", authMiddleware, getSubscriptionStatus);

module.exports = router;
