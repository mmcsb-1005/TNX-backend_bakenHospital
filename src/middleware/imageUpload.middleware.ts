// src/middleware/imageUpload.middleware.ts

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
const memoryStorage = multer.memoryStorage()

// 2. File Filter (remains the same)
const imageFileFilter = (req: Request, file: any, cb: any) => {
    // Add 'image/svg' to accommodate differences in client mimetypes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/svg'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type (${file.mimetype}). Only JPEG, PNG, GIF, WEBP, and SVG are allowed.`));
    }
};

const receiptFileFilter = (_req: Request, file: any, cb: any) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid receipt file type (${file.mimetype}). Only JPG, PNG, WEBP, and PDF are allowed.`));
    }
};

/**
 * Generic multer upload factory
 */
const createUploadMiddleware = (
  fieldName: string = 'image',
  fileFilter: multer.Options['fileFilter'] = imageFileFilter,
  maxFileSizeMb = 5,
) => {
  const upload = multer({
    storage: memoryStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
    }
  });

  // Returns the express middleware
  return upload.single(fieldName);
};

/**
 * Middleware for logo upload (Supabase Storage via controllers)
 */
export const logoUploadMiddleware = createUploadMiddleware('logo', imageFileFilter, 1);

/**
 * Middleware for training image upload (Supabase Storage via controllers)
 */
export const trainingImageUploadMiddleware = createUploadMiddleware('trainingImage', imageFileFilter, 1);

/**
 * Middleware for receipt upload (Supabase Storage via controllers)
 */
export const receiptUploadMiddleware = createUploadMiddleware('receipt', receiptFileFilter, 10);

/**
 * Middleware for payment proof upload (PDF or image)
 */
export const paymentProofUploadMiddleware = createUploadMiddleware('paymentProof', receiptFileFilter, 1);

/**
 * Middleware for staff photo upload (Supabase Storage via controllers)
 */
export const staffPhotoUploadMiddleware = createUploadMiddleware('photo', imageFileFilter, 1);

/**
 * Error handling middleware for multer errors (remains the same)
 */
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: `Upload failed: ${err.message}`, error: err.message });
  } else if (err) {
    res.status(400).json({ message: err.message, error: err.message });
  } else {
    next();
  }
};
