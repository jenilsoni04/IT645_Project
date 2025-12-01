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
    console.error("Error stack:", error.stack);
    
    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = "Server error";
    
    if (error.message?.includes("not configured") || error.message?.includes("Cloudinary")) {
      statusCode = 503; // Service Unavailable
      errorMessage = "File upload service is not available. Please contact support.";
    } else if (error.message?.includes("upload failed") || error.message?.includes("upload")) {
      statusCode = 502; // Bad Gateway
      errorMessage = error.message || "File upload failed. Please try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId =
      (req.user && (req.user._id || req.user.id)) || req.userId;

    if (!currentUserId) {
      return res
        .status(401)
        .json({ message: "User not authenticated for download" });
    }

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    const fileData = await messageService.downloadFileByMessageId(messageId);

    res.setHeader('Content-Type', fileData.contentType);
    res.setHeader('Content-Length', fileData.buffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileData.fileName}"`
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(fileData.buffer);
    console.log('File download initiated:', { messageId, fileName: fileData.fileName });
  } catch (error) {
    console.error('downloadFile error:', error);
    res.status(500).json({ message: error.message || "Download failed" });
  }
};
