const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow all file types including PDFs
  // You can add specific file type validation here if needed
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
  ];
  
  // Allow all files for now, but log the type
  console.log('Uploading file:', file.originalname, 'Type:', file.mimetype);
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = upload;
