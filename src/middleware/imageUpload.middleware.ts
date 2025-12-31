// src/middleware/imageUpload.middleware.ts (NEW CONTENT)

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
// Note: We no longer need 'fs' or 'path' for local storage logic
import { createCloudinaryStorage } from '../utils/cloudinary'; // Import the new utility

// 1. Define the Cloudinary Storage instances
// These folder names correspond to the subfolders used in createCloudinaryStorage
const logoStorage = createCloudinaryStorage('logos');
const staffPhotoStorage = createCloudinaryStorage('staff_photos');

// 2. File Filter (remains mostly the same for explicit error handling)
const fileFilter = (req: Request, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'));
    }
};

/**
 * Generic multer upload factory for Cloudinary
 */
const createCloudinaryUploadMiddleware = (storage: multer.StorageEngine, fieldName: string = 'image') => {
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
 * Middleware for logo upload using Cloudinary
 */
export const logoUploadMiddleware = createCloudinaryUploadMiddleware(logoStorage, 'logo');

/**
 * Middleware for staff photo upload using Cloudinary
 */
export const staffPhotoUploadMiddleware = createCloudinaryUploadMiddleware(staffPhotoStorage, 'photo');

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