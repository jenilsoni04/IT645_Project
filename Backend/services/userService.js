const User = require("../models/User");

const getProfile = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

const updateUserProfile = async (id, updates) => {
  const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
  if (!updatedUser) throw new Error("User not found");
  return updatedUser;
};

module.exports = {
  getProfile,
  getUserById,
  updateUserProfile,
};
