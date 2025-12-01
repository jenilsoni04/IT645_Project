const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const fs = require("fs");
const path = require("path");
const axios = require('axios');

// Local file storage fallback
const uploadToLocalStorage = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/chat');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = path.join(uploadsDir, `${timestamp}-${sanitizedFilename}`);

      // Write file to disk
      fs.writeFileSync(filePath, buffer);

      // Return full URL that can be accessed via express static
      // Use the base URL from environment or default to localhost:3000
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const fileUrl = `${baseUrl}/uploads/chat/${timestamp}-${sanitizedFilename}`;
      
      console.log('File saved locally:', filePath);
      console.log('File accessible at:', fileUrl);
      resolve({
        secure_url: fileUrl,
        public_id: `${timestamp}-${sanitizedFilename}`
      });
    } catch (error) {
      console.error('Local file storage error:', error);
      reject(new Error(`Failed to save file locally: ${error.message}`));
    }
  });
};

const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_SECRET_KEY;

    // If Cloudinary is not configured, use local storage
    if (!isCloudinaryConfigured) {
      console.log('Cloudinary not configured, using local file storage');
      return uploadToLocalStorage(buffer, filename)
        .then(resolve)
        .catch(reject);
    }

    // Determine resource type based on file extension
    const isPDF = filename.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filename);
    
    const uploadOptions = {
      folder: process.env.CLOUDINARY_FOLDER || "chat_uploads",
      public_id: `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      resource_type: isPDF ? "raw" : isImage ? "image" : "auto",
    };

    // Remove format for PDFs as it might cause issues
    if (isPDF) {
      uploadOptions.resource_type = "raw";
    }

    console.log('Uploading to Cloudinary:', filename, 'Options:', uploadOptions);

    try {
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            console.error('Error details:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name
            });
            return reject(new Error(`File upload failed: ${error.message || 'Unknown error'}`));
          }
          if (!result || !result.secure_url) {
            console.error('Cloudinary upload returned invalid result:', result);
            return reject(new Error('File upload failed: Invalid response from upload service'));
          }
          console.log('File uploaded successfully:', result.secure_url);

          // Verify uploaded file headers (helps debug corrupted uploads / wrong content-type)
          axios.head(result.secure_url, { timeout: 5000 })
            .then((resp) => {
              console.log('Uploaded file headers:', {
                url: result.secure_url,
                status: resp.status,
                contentType: resp.headers['content-type'],
                contentLength: resp.headers['content-length'],
              });
              resolve(result);
            })
            .catch((headErr) => {
              console.warn('Could not fetch uploaded file headers:', headErr.message);
              // Still resolve so upload flow continues; header fetch is only for diagnostics
              resolve(result);
            });
        }
      );

      streamifier.createReadStream(buffer).pipe(stream);
    } catch (err) {
      console.error('Error creating upload stream:', err);
      reject(new Error(`File upload failed: ${err.message}`));
    }
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
    try {
      console.log('Starting file upload for:', fileData.originalname);
      const upload = await uploadBufferToCloudinary(
        fileData.buffer,
        fileData.originalname
      );

      if (!upload || !upload.secure_url) {
        throw new Error('Upload failed: No URL returned');
      }

      messageData.fileUrl = upload.secure_url;
      messageData.fileName = fileData.originalname;
      messageData.content = content || fileData.originalname;
      console.log('File upload successful, URL:', upload.secure_url);
    } catch (uploadError) {
      console.error('File upload error in createMessage:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
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

exports.downloadFileByMessageId = async (messageId) => {
  try {
    const message = await Message.findById(messageId);
    if (!message || !message.fileUrl) {
      throw new Error('Message or file not found');
    }

    // Fetch the file from Cloudinary
    const response = await axios.get(message.fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const fileBuffer = response.data;
    const fileName = message.fileName || 'download';
    const isPDF = fileName.toLowerCase().endsWith('.pdf');
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (isPDF) {
      contentType = 'application/pdf';
    } else if (/\.(jpg|jpeg)$/i.test(fileName)) {
      contentType = 'image/jpeg';
    } else if (/\.png$/i.test(fileName)) {
      contentType = 'image/png';
    } else if (/\.gif$/i.test(fileName)) {
      contentType = 'image/gif';
    } else if (/\.(doc|docx)$/i.test(fileName)) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (/\.txt$/i.test(fileName)) {
      contentType = 'text/plain';
    }

    console.log('Fetched file from Cloudinary:', {
      messageId,
      fileName,
      contentType,
      size: fileBuffer.length,
    });

    return {
      buffer: fileBuffer,
      fileName,
      contentType,
    };
  } catch (error) {
    console.error('Error downloading file:', error.message);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};
