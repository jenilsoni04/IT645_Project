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
    
    currency: process.env.RAZORPAY_CURRENCY || "INR",
    amount: (() => {
      const targetCurrency = process.env.RAZORPAY_CURRENCY || "INR";
      const priceINR = plan.price;
      if (targetCurrency === "INR") {
        return priceINR * 100;
      }

      
      const inrToUsd = parseFloat(process.env.INR_TO_USD_RATE) || 82;
      if (targetCurrency === "USD") {
        const priceUSD = priceINR / inrToUsd;
        return Math.round(priceUSD * 100);
      }

      return priceINR * 100;
    })(),
    receipt: `receipt_${shortId}`,
    payment_capture: 1, 
  };

  console.log("Creating Razorpay order with options:", options);
  let order;
  try {
    order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order.id);
  } catch (err) {
    console.error("Razorpay order creation failed:", err && err.error ? err.error : err);
    const reason = err?.error?.description || err?.error?.reason || err?.message || '';
    if (typeof reason === 'string' && reason.toLowerCase().includes('international')) {
      const e = new Error('Payments from international cards are not allowed on this account. Enable international payments in Razorpay dashboard or contact support.');
      e.status = 400;
      throw e;
    }
    const e = new Error('Failed to create payment order with Razorpay');
    e.original = err;
    throw e;
  }

  return {
    orderId: order.id,
    amount: options.amount,
    currency: options.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
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
