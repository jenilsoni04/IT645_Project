const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    // Determine resource type based on file extension
    const isPDF = filename.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filename);
    
    const uploadOptions = {
      folder: process.env.CLOUDINARY_FOLDER || "chat_uploads",
      public_id: `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      resource_type: isPDF ? "raw" : isImage ? "image" : "auto",
      // For PDFs, ensure they're stored as raw files
      ...(isPDF && { resource_type: "raw", format: "pdf" }),
    };

    console.log('Uploading to Cloudinary:', filename, 'Options:', uploadOptions);

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        console.log('File uploaded successfully:', result.secure_url);
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
