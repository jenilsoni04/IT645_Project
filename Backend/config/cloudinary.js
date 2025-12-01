const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Check if Cloudinary is configured
const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_SECRET_KEY;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });
  console.log('Cloudinary configured successfully');
} else {
  console.warn('⚠️  Cloudinary not configured. File uploads will fail.');
  console.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_SECRET_KEY in your .env file');
}

module.exports = cloudinary;
