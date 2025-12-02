const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  createdAt: { type: Date, default: Date.now },
  skillsHave: {
    type: [String],
    validate: [skillLimit, "You can list up to 3 skills you have."],
  },
  skillsWant: {
    type: [String],
    validate: [skillLimit, "You can list up to 3 skills you want to learn."],
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
  },
  freeConnectionLeft: { type: Number, default: 2 },
  isBanned: {
    type: Boolean,
    default: false
  }
});

function skillLimit(val) {
  return val.length <= 3;
}

module.exports = mongoose.model("User", UserSchema);


