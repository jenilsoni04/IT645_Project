const messageService = require("../services/messageService");

let io = null;

exports.initMessageController = (ioInstance) => {
  io = ioInstance;
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId =
      (req.user && (req.user._id || req.user.id)) || req.userId;

    if (!currentUserId) {
      return res
        .status(401)
        .json({ message: "User not authenticated for messages" });
    }

    const result = await messageService.getMessagesBetweenUsers(
      currentUserId,
      userId
    );

    // just return messages
    res.json(result.messages);
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type } = req.body;
    const fileData = req.file || null;

    const senderId =
      (req.user && (req.user._id || req.user.id)) || req.userId;

    if (!senderId) {
      return res
        .status(401)
        .json({ message: "User not authenticated for sending message" });
    }

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    // Validate file if present
    if (fileData) {
      if (fileData.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size exceeds 10MB limit" });
      }
      console.log("Uploading file:", fileData.originalname, "Size:", fileData.size, "Type:", fileData.mimetype);
    }

    const result = await messageService.createMessage(
      senderId,
      receiverId,
      content,
      type,
      fileData
    );

    if (io) {
      io.to(`user:${result.senderId}`).emit("newMessage", result.message);
      io.to(`user:${result.receiverId}`).emit("newMessage", result.message);
    }

    res.status(201).json(result.message);
  } catch (error) {
    console.error("sendMessage error:", error);
    const statusCode = error.message?.includes("Cloudinary") ? 502 : 500;
    res.status(statusCode).json({ 
      message: error.message || "Server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};
