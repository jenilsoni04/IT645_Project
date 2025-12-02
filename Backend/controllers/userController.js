const {
  getUserById,
  updateUserProfile,
  getProfile,
} = require("../services/userService");

exports.getProfile = async (req, res) => {
  try {
    const user = await getProfile(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedUser = await updateUserProfile(id, updates);
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: "Error updating profile", error: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: "User not found", error: err.message });
  }
};
