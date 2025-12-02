const {
  createOrderService,
  verifyPaymentService,
  getSubscriptionStatusService,
} = require("../services/Subscription");

exports.createOrder = async (req, res) => {
  try {
    const { planName } = req.body;
    if (!planName) {
      return res.status(400).json({ message: "Plan name is required" });
    }
    const data = await createOrderService(planName);
    res.status(200).json(data);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(400).json({ message: err.message || "Failed to create order" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { userId, planName, orderId, paymentId, signature } = req.body;
    
    if (!userId || !planName || !orderId || !paymentId || !signature) {
      return res.status(400).json({ message: "Missing required payment details" });
    }

    if (String(req.user._id) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const result = await verifyPaymentService(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(400).json({ message: err.message || "Payment verification failed" });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (String(req.user._id) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const data = await getSubscriptionStatusService(userId);
    res.status(200).json(data);
  } catch (err) {
    console.error("Get subscription status error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
