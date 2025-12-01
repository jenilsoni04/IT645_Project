const Subscription = require("../models/Subscription");
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");

const plans = {
  Basic: { price: 99, connectionsAllowed: 5, durationDays: 30 },
  Premium: { price: 299, connectionsAllowed: 15, durationDays: 30 },
};

exports.createOrderService = async (planName) => {
  if (!plans[planName]) throw new Error("Invalid plan selected");

  const plan = plans[planName];
  const shortId = crypto.randomBytes(4).toString("hex");

  const options = {
    amount: plan.price * 100,
    currency: "INR",
    receipt: `receipt_${shortId}`,
    payment_capture: 1, // Auto capture payment
  };

  console.log("Creating Razorpay order with options:", options);
  const order = await razorpay.orders.create(options);
  console.log("Razorpay order created:", order.id);

  return {
    orderId: order.id,
    amount: options.amount,
    currency: options.currency,
    keyId: process.env.RAZORPAY_KEY_ID, // Send key ID to frontend
  };
};

exports.verifyPaymentService = async ({
  userId,
  planName,
  orderId,
  paymentId,
  signature,
}) => {
  if (!plans[planName]) throw new Error("Invalid plan selected");

  const plan = plans[planName];

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + "|" + paymentId)
    .digest("hex");

  console.log("Signature verification:", {
    received: signature,
    generated: generatedSignature,
    match: generatedSignature === signature,
  });

  if (generatedSignature !== signature) {
    console.error("Signature mismatch!");
    throw new Error("Invalid signature");
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

  const existingSubscription = await Subscription.findOne({
    userId,
    status: "active",
  });

  if (existingSubscription) {
    existingSubscription.planName = planName;
    existingSubscription.price = plan.price;
    existingSubscription.connectionsAllowed = plan.connectionsAllowed;
    existingSubscription.connectionsLeft = plan.connectionsAllowed;
    existingSubscription.expiryDate = expiryDate;
    existingSubscription.paymentId = paymentId;
    await existingSubscription.save();
  } else {
    const newSub = new Subscription({
      userId,
      planName,
      price: plan.price,
      connectionsAllowed: plan.connectionsAllowed,
      connectionsLeft: plan.connectionsAllowed,
      expiryDate,
      paymentId,
      status: "active",
    });
    await newSub.save();
  }

  return { message: "Subscription activated successfully!" };
};

exports.getSubscriptionStatusService = async (userId) => {
  const subscription = await Subscription.findOne({
    userId,
    status: "active",
  });

  if (!subscription) {
    return { isSubscribed: false, plan: null, connectionsLeft: 2 };
  }

  return {
    isSubscribed: true,
    plan: subscription.planName,
    expiryDate: subscription.expiryDate,
    connectionsLeft: subscription.connectionsLeft,
  };
};
