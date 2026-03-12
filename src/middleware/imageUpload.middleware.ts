// src/middleware/imageUpload.middleware.ts

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Define storage for different upload types

// --- Local Storage for Logos ---
// From backend/src/middleware -> go up to workspace root -> frontend/public/logo
const logoStoragePath = path.join(__dirname, '../../../frontend/public/logo');

// Ensure the logo directory exists
if (!fs.existsSync(logoStoragePath)) {
  fs.mkdirSync(logoStoragePath, { recursive: true });
}

// Log the resolved path for debugging
console.log('Logo storage path:', logoStoragePath);

const localLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoStoragePath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  }
});

// --- Cloudinary Storage for Staff Photos (as an example of keeping both) ---
import { createCloudinaryStorage } from '../utils/cloudinary';
const staffPhotoStorage = createCloudinaryStorage('staff_photos');


// 2. File Filter (remains the same)
const fileFilter = (req: Request, file: any, cb: any) => {
    // Add 'image/svg' to accommodate differences in client mimetypes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/svg'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type (${file.mimetype}). Only JPEG, PNG, GIF, WEBP, and SVG are allowed.`));
    }
};

/**
 * Generic multer upload factory
 */
const createUploadMiddleware = (storage: multer.StorageEngine, fieldName: string = 'image') => {
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    }
  });

  // Returns the express middleware
  return upload.single(fieldName);
};

/**
 * Middleware for logo upload using LOCAL STORAGE
 */
export const logoUploadMiddleware = createUploadMiddleware(localLogoStorage, 'logo');

/**
 * Middleware for staff photo upload using Cloudinary
 */
export const staffPhotoUploadMiddleware = createUploadMiddleware(staffPhotoStorage, 'photo');

/**
 * Error handling middleware for multer errors (remains the same)
 */
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `Upload failed: ${err.message}` });
  } else if (err) {
    res.status(400).json({ error: err.message });
  } else {
    next();
  }
};