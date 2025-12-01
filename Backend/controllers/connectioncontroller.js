const {
  getUserSuggestions,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionStatus,
  getUserConnections, // already imported, don’t redefine it
} = require("../services/connection");

// 🔹 Fetch suggested users
const fetchSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const suggestions = await getUserSuggestions(userId);
    res.status(200).json(suggestions);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error while fetching suggestions",
    });
  }
};

// 🔹 Send connection request
const sendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;
    const result = await sendConnectionRequest(senderId, receiverId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔹 Accept connection request
const acceptRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const result = await acceptConnectionRequest(senderId, receiverId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔹 Reject connection request
const rejectRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const result = await rejectConnectionRequest(senderId, receiverId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔹 Check connection request status
const requestStatus = async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;
    const result = await getConnectionStatus(senderId, receiverId);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// 🔹 Fetch user connections
const fetchConnections = async (req, res) => {
  try {
    const userId = req.user._id;
    const connectedUsers = await getUserConnections(userId);
    res.status(200).json({
      success: true,
      data: connectedUsers,
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  fetchSuggestions,
  sendRequest,
  acceptRequest,
  rejectRequest,
  requestStatus,
  fetchConnections,
};
