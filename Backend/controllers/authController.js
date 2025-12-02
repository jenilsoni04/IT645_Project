const authService = require("../services/authService");

exports.register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(200).json({ message: "Verification email sent.", userId: user._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { token, user } = await authService.loginUser(req.body);
    res.status(200).json({ message: "Login Success", token, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;
    const message = await authService.verifyUserEmail(userId, verificationCode);
    res.status(200).json({ message });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
