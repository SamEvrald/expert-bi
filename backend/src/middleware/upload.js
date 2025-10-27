const multer = require('multer');
const multerS3 = require('multer-s3');
const s3Client = require('../config/s3');
const AppError = require('../utils/AppError');

// Configure S3 storage for CSV files
const storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET || 'expert-bi-datasets',
  key: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = require('path').extname(file.originalname);
    const key = `datasets/${req.user.id}/${timestamp}_${randomString}${ext}`;
    cb(null, key);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, {
      originalName: file.originalname,
      uploadedBy: req.user.id,
      uploadedAt: new Date().toISOString()
    });
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Check file type - be more permissive with CSV detection
  const isCSV = file.mimetype === 'text/csv' || 
                file.mimetype === 'application/csv' || 
                file.mimetype === 'text/plain' ||
                file.originalname.toLowerCase().endsWith('.csv');
                
  if (isCSV) {
    console.log('File accepted as CSV');
    cb(null, true);
  } else {
    console.log('File rejected - not CSV format');
    cb(new AppError('Only CSV files are allowed', 400), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 1 // Only one file at a time
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.error('Upload error details:', {
    error: error.message,
    code: error.code,
    stack: error.stack
  });
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed',
        error: 'TOO_MANY_FILES'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name',
        error: 'UNEXPECTED_FIELD'
      });
    }
  }
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
  
  // Log other errors for debugging
  console.error('Unhandled upload error:', error);
  return res.status(500).json({
    success: false,
    message: 'File upload failed',
    error: error.message
  });
};

module.exports = {
  upload,
  handleMulterError
};