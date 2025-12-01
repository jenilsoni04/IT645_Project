const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

exports.registerUser = async ({ name, email, password, skillsHave = [], skillsWant = [] }) => {
  if (skillsHave.length > 3 || skillsWant.length > 3) {
    throw new Error("Maximum 3 skills allowed per field.");
  }

  let user = await User.findOne({ email });
  if (user) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

  user = new User({ name, email, password: hashedPassword, verificationCode, skillsHave, skillsWant });
  await user.save();

  await sendEmail(email, "Verify Your Email", `Your verification code is: ${verificationCode}`);

  return user;
};

exports.loginUser = async ({ email, password }) => {
  if (!email || !password) throw new Error("Email and password are required");

  let user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

  return { token, user };
};

exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

exports.verifyUserEmail = async (userId, verificationCode) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.verificationCode !== verificationCode) {
      console.log("Code error");
    throw new Error("Invalid verification code");
  }


  user.isVerified = true;
  user.verificationCode = null;
  await user.save();

  return "Email verified successfully!";
};