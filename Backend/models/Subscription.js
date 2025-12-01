const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planName: { type: String, enum: ["Basic", "Premium"], required: true },
  price: { type: Number, required: true },
  connectionsAllowed: { type: Number, required: true },
  connectionsLeft: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  paymentId: { type: String, required: true },
  status: { type: String, enum: ["active", "expired"], default: "active" },
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
