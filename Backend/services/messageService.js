const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "chat_uploads",
        resource_type: "auto",
        public_id: `${Date.now()}-${filename}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

exports.getMessagesBetweenUsers = async (currentUserId, otherUserId) => {
  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId },
    ],
  })
    .populate("sender", "name email")
    .populate("receiver", "name email")
    .sort({ createdAt: 1 });

  return {
    messages,
    otherUserId,
    currentUserId,
  };
};

exports.createMessage = async (
  senderId,
  receiverId,
  content,
  type,
  fileData = null
) => {
  let messageData = {
    sender: senderId,
    receiver: receiverId,
    type: fileData ? "file" : "text",
  };

  if (fileData) {
    const upload = await uploadBufferToCloudinary(
      fileData.buffer,
      fileData.originalname
    );

    messageData.fileUrl = upload.secure_url;
    messageData.fileName = fileData.originalname;
    messageData.content = fileData.originalname;
  } else {
    messageData.content = content || "";
  }

  const message = new Message(messageData);
  await message.save();

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "name email")
    .populate("receiver", "name email")
    .lean();

  return {
    message: populatedMessage,
    senderId,
    receiverId,
  };
};
